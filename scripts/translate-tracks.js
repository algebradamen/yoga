/**
 * Translates all .NO.yaml track files to English and Spanish using the Claude CLI.
 * Norwegian source files are never modified.
 *
 * Usage: node scripts/translate-tracks.js
 *
 * Running as a GitHub Action:
 *   1. Store your Anthropic API key as a repository secret named ANTHROPIC_API_KEY.
 *   2. In your workflow, install the CLI and expose the secret:
 *
 *      - run: npm install -g @anthropic-ai/claude-code
 *      - run: npm run translate
 *        env:
 *          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
 *
 *   No interactive login is needed; claude -p runs non-interactively via the API key.
 */

import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const ROOT = new URL('..', import.meta.url).pathname

const TARGETS = [
  { lang: 'English', outName: base => `${base}.yaml` },
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

  const result = spawnSync('claude', ['-p', prompt], {
    encoding: 'utf-8',
    maxBuffer: 4 * 1024 * 1024,
    timeout: 120_000,
  })

  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`claude exited ${result.status}: ${result.stderr?.trim()}`)

  // Strip accidental code-fence wrapping
  return result.stdout.trim().replace(/^```ya?ml\s*/i, '').replace(/\s*```$/, '')
}

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
      translated = translate(noContent, lang)
    } catch (e) {
      console.log('✗')
      console.error(`  ${e.message}`)
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
