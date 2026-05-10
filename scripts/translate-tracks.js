/**
 * Translates all .NO.yaml track files to English and Spanish.
 * Norwegian source files are never modified.
 *
 * Usage:
 *   node scripts/translate-tracks.js           # uses claude CLI (default)
 *   TRANSLATE_BACKEND=api node scripts/...     # uses Anthropic API
 *
 * API backend requires ANTHROPIC_API_KEY in env or api-key.txt in project root.
 */

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { validateTrack } from './validate-track.js'

const ROOT = new URL('..', import.meta.url).pathname
const BACKEND = process.env.TRANSLATE_BACKEND ?? 'console'

const TARGETS = [
  { lang: 'English', outName: base => `${base}.EN.yaml` },
  { lang: 'Spanish', outName: base => `${base}.ES.yaml` },
]

function buildPrompt(noContent, targetLang) {
  return `Translate the following yoga session YAML file from Norwegian to ${targetLang}.

Rules:
- Keep ALL YAML field names exactly as-is (Name, Duration, Description, Poses, Sensation, Meridians, Rebound, Alternatives, Transition, Adjustments, Instructions, Counterpose, etc.)
- Translate only the string values: pose names, descriptions, sensation items, rebound descriptions, alternative names and descriptions
- Translate meridian names to ${targetLang} (e.g. "Nyre" → "Kidney" in English, "Riñón" in Spanish)
- Preserve all markdown formatting (bold **, italic _, etc.)
- Preserve the exact YAML structure, indentation, blank lines between poses, and quoting style
- Output ONLY the raw YAML — no explanations, no markdown code fences

YAML to translate:
${noContent}`
}

function stripFences(text) {
  return text.trim().replace(/^```ya?ml\s*/i, '').replace(/\s*```$/, '')
}

async function translateViaConsole(noContent, targetLang) {
  const prompt = buildPrompt(noContent, targetLang)
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['--print'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    proc.stdout.on('data', chunk => { stdout += chunk })
    proc.stderr.on('data', chunk => { stderr += chunk })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`claude exited ${code}: ${stderr.trim()}`))
      else resolve(stripFences(stdout))
    })
    const timer = setTimeout(() => { proc.kill(); reject(new Error('timed out after 3 min')) }, 180_000)
    proc.on('close', () => clearTimeout(timer))
    proc.stdin.write(prompt, 'utf-8')
    proc.stdin.end()
  })
}

async function translateViaAPI(noContent, targetLang) {
  const keyFile = path.join(ROOT, 'api-key.txt')
  if (!process.env.ANTHROPIC_API_KEY) {
    if (fs.existsSync(keyFile)) {
      process.env.ANTHROPIC_API_KEY = fs.readFileSync(keyFile, 'utf-8').trim()
    } else {
      throw new Error('ANTHROPIC_API_KEY not set and api-key.txt not found')
    }
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(noContent, targetLang) }]
  })
  return stripFences(response.content[0].text)
}

async function translate(noContent, targetLang) {
  if (BACKEND === 'api') return translateViaAPI(noContent, targetLang)
  return translateViaConsole(noContent, targetLang)
}

async function main() {
  const noFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.NO.yaml')).sort()
  if (noFiles.length === 0) { console.log('No .NO.yaml files found.'); process.exit(0) }

  console.log(`Backend: ${BACKEND}`)
  const changed = [], failed = []

  for (const noFile of noFiles) {
    const base = noFile.replace(/\.NO\.yaml$/, '')
    const noContent = fs.readFileSync(path.join(ROOT, noFile), 'utf-8')

    for (const { lang, outName } of TARGETS) {
      const fileName = outName(base)
      const filePath = path.join(ROOT, fileName)
      process.stdout.write(`Translating ${noFile} → ${fileName} (${lang})... `)

      let translated
      try {
        translated = await translate(noContent, lang)
      } catch (e) {
        console.log('✗')
        console.error(`  ${e.message}`)
        failed.push(fileName)
        continue
      }

      const { ok, errors } = validateTrack(translated)
      if (!ok) {
        console.log('✗')
        console.error(`  validation failed:`)
        for (const e of errors) console.error(`    ${e}`)
        failed.push(fileName)
        continue
      }

      const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null
      if (existing === translated + '\n' || existing === translated) {
        console.log('no changes')
      } else {
        fs.writeFileSync(filePath, translated + '\n')
        console.log('✓')
        changed.push(fileName)
      }
    }
  }

  console.log('\n---')
  if (failed.length > 0) console.error(`${failed.length} translation(s) failed: ${failed.join(', ')}`)
  if (changed.length === 0) {
    console.log('No files changed.')
  } else {
    console.log(`${changed.length} file(s) updated:\n${changed.map(f => `  • ${f}`).join('\n')}`)
    console.log(`\nProposed commit:\n  git add ${changed.join(' ')}\n  git commit -m "translate tracks to EN and ES from NO source"`)
  }
  console.log('---')
}

main().catch(e => { console.error(e); process.exit(1) })
