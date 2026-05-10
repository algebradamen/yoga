/**
 * Translates all .NO.yaml track files to English and Spanish using the Anthropic API.
 * Norwegian source files are never modified.
 *
 * Usage: node scripts/translate-tracks.js
 *
 * Requires ANTHROPIC_API_KEY to be set in the environment.
 * Create a key at console.anthropic.com → API Keys.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { validateTrack } from './validate-track.js'

const ROOT = new URL('..', import.meta.url).pathname

const TARGETS = [
  { lang: 'English', outName: base => `${base}.EN.yaml` },
  { lang: 'Spanish', outName: base => `${base}.ES.yaml` },
]

const client = new Anthropic()

async function translate(noContent, targetLang) {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Translate the following yoga session YAML file from Norwegian to ${targetLang}.

Rules:
- Keep ALL YAML field names exactly as-is (Name, Duration, Description, Poses, Sensation, Meridians, Rebound, Alternatives, Transition, Adjustments, Instructions, Counterpose, etc.)
- Translate only the string values: pose names, descriptions, sensation items, rebound descriptions, alternative names and descriptions
- Translate meridian names to ${targetLang} (e.g. "Nyre" → "Kidney" in English, "Riñón" in Spanish)
- Preserve all markdown formatting (bold **, italic _, etc.)
- Preserve the exact YAML structure, indentation, blank lines between poses, and quoting style
- Output ONLY the raw YAML — no explanations, no markdown code fences

YAML to translate:
${noContent}`
    }]
  })
  return response.content[0].text.trim()
    .replace(/^```ya?ml\s*/i, '').replace(/\s*```$/, '')
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
