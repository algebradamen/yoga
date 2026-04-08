/**
 * @fileoverview Parses and validates yoga track YAML files, then outputs JSON.
 *
 * Reads all `.yaml`/`.yml` files from the project root, validates each against
 * `track.schema.json` using AJV, warns if pose durations don't sum to the
 * stated track duration, and writes valid tracks as JSON to `generated/`.
 *
 * Usage: `node scripts/parse-track-yaml.js`
 */

import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import Ajv from 'ajv/dist/2020.js'

const root = path.resolve('./scripts', '..')
const generatedDir = path.join(root, 'generated')

const schemaPath = path.join(root, 'track.schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
const ajv = new Ajv({ strict: false })
const validate = ajv.compile(schema)

// Find all .yaml files in the project root
const yamlFiles = fs.readdirSync(root)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))

if (yamlFiles.length === 0) {
  console.log('No YAML files found.')
  process.exit(0)
}

fs.mkdirSync(generatedDir, { recursive: true })

let allOk = true
for (const file of yamlFiles) {
  const inputPath = path.join(root, file)
  const content = fs.readFileSync(inputPath, 'utf-8')
  let result
  try {
    result = YAML.parse(content)
  } catch (e) {
    console.error(`✗ ${file}: YAML parse error – ${e.message}`)
    allOk = false
    continue
  }

  const valid = validate(result)
  if (!valid) {
    console.error(`✗ ${file}: schema validation failed`)
    for (const err of validate.errors) {
      console.error(`    ${err.instancePath || '(root)'}: ${err.message}`)
    }
    allOk = false
    continue
  }

  // Duration check
  const posesWithDuration = result.Poses.filter(p => typeof p.Duration === 'number')
  const posesWithout     = result.Poses.filter(p => typeof p.Duration !== 'number')
  const poseTotal        = posesWithDuration.reduce((s, p) => s + p.Duration, 0)
  const stated           = result.Duration
  if (poseTotal !== stated) {
    const sign   = poseTotal > stated ? `+${poseTotal - stated}` : `${poseTotal - stated}`
    const noInfo = posesWithout.length ? ` (${posesWithout.length} pose(s) have no duration: ${posesWithout.map(p => p.Name).join(', ')})` : ''
    console.warn(`  ⚠ ${file}: pose durations sum to ${poseTotal} min, stated track duration is ${stated} min (${sign})${noInfo}`)
  }

  const outName = file.replace(/\.ya?ml$/, '.json')
  const outPath = path.join(generatedDir, outName)
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`✓ ${file}  →  generated/${outName}`)
}

process.exit(allOk ? 0 : 1)
