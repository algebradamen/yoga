/**
 * @fileoverview Validates one or more yoga track YAML files against the schema.
 *
 * Uses the same validation as the build (`validate-track.js`), so durations like
 * "0,5" are accepted. Validates the given files, or every `.yaml`/`.yml` file in
 * the project root when no arguments are given. Does not check duration totals;
 * `npm run generate:json` does that.
 *
 * Usage: `node scripts/validate-yaml.js [file1.yaml file2.yaml ...]`
 */

import fs from 'fs'
import path from 'path'
import { validateTrack } from './validate-track.js'

const root = path.resolve('./scripts', '..')

const files = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(root).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).sort()

let allOk = true
for (const f of files) {
  const { ok, errors } = validateTrack(fs.readFileSync(path.resolve(root, f), 'utf-8'))
  if (ok) {
    console.log(`✓ ${f}`)
  } else {
    allOk = false
    console.error(`✗ ${f}`)
    for (const e of errors) console.error(`    ${e}`)
  }
}
process.exit(allOk ? 0 : 1)
