/**
 * @fileoverview Parses and validates yoga track YAML files, then outputs JSON.
 *
 * Reads all `.yaml`/`.yml` files from the project root, validates each against
 * `track.schema.json` using AJV (durations like "0,5" are accepted), and checks
 * that pose durations add up to the stated track duration: a difference of up
 * to 10% gives a warning, more than 10% fails the build. Rebound durations are
 * not counted. A track where no pose has a duration only gets a warning. Valid tracks are written as JSON to `generated/`.
 *
 * Usage: `node scripts/parse-track-yaml.js`
 */

import fs from 'fs'
import path from 'path'
import { validateTrack } from './validate-track.js'

const root = path.resolve('./scripts', '..')
const generatedDir = path.join(root, 'generated')

// Find all .yaml files in the project root
const yamlFiles = fs.readdirSync(root)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))

if (yamlFiles.length === 0) {
  console.log('No YAML files found.')
  process.exit(0)
}

// Clean before regenerating so stale JSON from deleted/renamed YAML files don't persist
fs.rmSync(generatedDir, { recursive: true, force: true })
fs.mkdirSync(generatedDir, { recursive: true })

const warnings = []
let allOk = true
for (const file of yamlFiles) {
  const inputPath = path.join(root, file)
  const content = fs.readFileSync(inputPath, 'utf-8')
  const { ok, data: result, errors } = validateTrack(content)
  if (!ok) {
    const isYaml = errors[0].startsWith('YAML')
    console.error(`✗ ${file}: ${isYaml ? errors[0] : 'schema validation failed'}`)
    if (!isYaml) for (const e of errors) console.error(`    ${e}`)
    allOk = false
    continue
  }

  // Duration check (section headings are not poses)
  const poses            = result.Poses.filter(p => !('Section' in p))
  const posesWithDuration = poses.filter(p => typeof p.Duration === 'number')
  const posesWithout     = poses.filter(p => typeof p.Duration !== 'number')
  const poseTotal        = posesWithDuration.reduce((s, p) => s + p.Duration, 0)
  const stated           = result.Duration
  if (posesWithDuration.length === 0) {
    // A session without any pose timings can't be checked; build it anyway
    warnings.push(`  ⚠ ${file}: no pose has a duration, so the duration check was skipped`)
  } else if (poseTotal !== stated) {
    const diff    = poseTotal - stated
    const sign    = diff > 0 ? `+${diff}` : `${diff}`
    const pct     = Math.round(Math.abs(diff) / stated * 100)
    const noInfo  = posesWithout.length ? ` (${posesWithout.length} pose(s) have no duration: ${posesWithout.map(p => p.Name).join(', ')})` : ''
    const msg     = `${file}: pose durations sum to ${poseTotal} min, stated track duration is ${stated} min (${sign}, ${pct}%)${noInfo}`
    if (pct > 10) {
      console.error(`✗ ${msg}`)
      allOk = false
      continue
    } else {
      warnings.push(`  ⚠ ${msg}`)
    }
  }

  const outName = file.replace(/\.ya?ml$/, '.json')
  const outPath = path.join(generatedDir, outName)
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`✓ ${file}  →  generated/${outName}`)
}

if (warnings.length > 0) {
  console.warn('---')
  for (const w of warnings) console.warn(w)
  console.warn('---')
}

process.exit(allOk ? 0 : 1)
