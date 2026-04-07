import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import Ajv from 'ajv/dist/2020.js'

const root = path.join('./scripts', '..')
const schema = JSON.parse(fs.readFileSync(path.join(root, 'track.schema.json'), 'utf-8'))
const ajv = new Ajv({ strict: false })
const validate = ajv.compile(schema)

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['sample-track.yaml', 'yin-60-track.yaml', 'yin-60-heart-kidney-meridian.yaml']

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

