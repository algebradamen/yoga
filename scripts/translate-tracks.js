/**
 * Translates all .NO.yaml track files to English and Spanish using the Claude CLI.
 * Norwegian source files are never modified.
 *
 * Usage: node scripts/translate-tracks.js
 *
 * Authentication:
 *   This script uses ANTHROPIC_API_KEY, NOT the OAuth tokens shown at
 *   claude.ai/settings/claude-code (those are for interactive CLI login only).
 *
 *   To create an API key:
 *     1. Go to console.anthropic.com → API Keys → Create Key.
 *     2. Copy the key immediately — it is only shown once.
 *     3. Set it in your shell: export ANTHROPIC_API_KEY=sk-ant-...
 *
 * Running as a GitHub Action:
 *   1. Add the API key as a repository secret named ANTHROPIC_API_KEY
 *      (Settings → Secrets and variables → Actions → New repository secret).
 *   2. The workflow in .github/workflows/translate.yml exposes it automatically:
 *
 *      - run: npm install -g @anthropic-ai/claude-code
 *      - run: npm run translate
 *        env:
 *          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { validateTrack } from './validate-track.js'

const ROOT = new URL('..', import.meta.url).pathname
const TIMEOUT_MS = 60_000

const TARGETS = [
  { lang: 'English', outName: base => `${base}.EN.yaml` },
  { lang: 'Spanish', outName: base => `${base}.ES.yaml` },
]

function translate(noContent, targetLang) {
  const prompt = `Translate the following yoga session YAML file from Norwegian to ${targetLang}.

Rules:
- Keep ALL YAML field names exactly as-is (Name, Duration, Description, Poses, Sensation, Meridians, Rebound, Alternatives, etc.)
- Translate only the string values: pose names, descriptions, sensation items, rebound descriptions, alternative names and descriptions
- Translate meridian names to ${targetLang} (e.g. "Nyre" → "Kidney" in English, "Riñón" in Spanish)
- Preserve all markdown formatting (bold **, italic _, etc.)
- Preserve the exact YAML structure, indentation, blank lines between poses, and quoting style
- Output ONLY the raw YAML — no explanations, no markdown code fences

YAML to translate:
${noContent}`

  return new Promise((resolve, reject) => {
    const start = Date.now()
    console.error(`  [claude] spawning process`)

    const proc = spawn('claude', ['--print', '--dangerously-skip-permissions'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', chunk => {
      stdout += chunk
      console.error(`  [claude] received ${stdout.length} bytes so far`)
    })
    proc.stderr.on('data', chunk => {
      stderr += chunk
      process.stderr.write(`  [claude:stderr] ${chunk}`)
    })
    proc.on('error', err => {
      console.error(`  [claude] process error: ${err.message}`)
      reject(err)
    })
    proc.on('close', code => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.error(`  [claude] exited with code ${code} after ${elapsed}s`)
      if (code !== 0) reject(new Error(`claude exited ${code}: ${stderr.trim()}`))
      else resolve(stdout.trim().replace(/^```ya?ml\s*/i, '').replace(/\s*```$/, ''))
    })

    const timer = setTimeout(() => { proc.kill(); reject(new Error('timed out after 1 min')) }, TIMEOUT_MS)
    proc.on('close', () => clearTimeout(timer))

    console.error(`  [claude] sending ${prompt.length} char prompt`)
    proc.stdin.write(prompt, 'utf-8')
    proc.stdin.end()
  })
}

async function main() {
  const noFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.NO.yaml')).sort()

  if (noFiles.length === 0) {
    console.log('No .NO.yaml files found.')
    process.exit(0)
  }

  const changed = []
  const failed = []

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
  if (failed.length > 0) {
    console.error(`${failed.length} translation(s) failed: ${failed.join(', ')}`)
  }
  if (changed.length === 0) {
    console.log('No files changed.')
  } else {
    console.log(`${changed.length} file(s) updated:\n${changed.map(f => `  • ${f}`).join('\n')}`)
    console.log(`
Proposed commit:
  git add ${changed.join(' ')}
  git commit -m "translate tracks to EN and ES from NO source"`)
  }
  console.log('---')
}

main().catch(e => { console.error(e); process.exit(1) })
