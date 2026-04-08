/**
 * @fileoverview Validates one or more yoga track YAML files against the schema.
 *
 * Accepts file paths as command-line arguments; falls back to a default set of
 * files if none are provided. Validates each file against `track.schema.json`
 * using AJV and reports pass/fail per file.
 *
 * Usage: `node scripts/validate-yaml.js [file1.yaml file2.yaml ...]`
 */

import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import Ajv from 'ajv/dist/2020.js'

const root = path.join('./scripts', '..')
const schema = JSON.parse(fs.readFileSync(path.join(root, 'track.schema.json'), 'utf-8'))
const ajv = new Ajv({strict: false})
const validate = ajv.compile(schema)

const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['yin-60-track.yaml', 'yin-60-heart-kidney-meridian.yaml']

let allOk = true
for (const f of files) {
    const data = YAML.parse(fs.readFileSync(path.join(root, f), 'utf-8'))
    const ok = validate(data)
    if (!ok) {
        allOk = false
        console.error(`✗ ${f}`)
        for (const err of validate.errors) {
            console.error(`    ${err.instancePath || '(root)'}: ${err.message}`)
        }
    } else {
        console.log(`✓ ${f}`)
    }
}
process.exit(allOk ? 0 : 1)

