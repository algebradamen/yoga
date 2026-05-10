import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import Ajv from 'ajv/dist/2020.js'

const root = path.resolve('./scripts', '..')
const schema = JSON.parse(fs.readFileSync(path.join(root, 'track.schema.json'), 'utf-8'))
const ajv = new Ajv({ strict: false })
const validate = ajv.compile(schema)

function parseDuration(v) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? v : n
  }
  return v
}

export function normalizeDurations(track) {
  if (track.Duration != null) track.Duration = parseDuration(track.Duration)
  for (const pose of track.Poses ?? []) {
    if (pose.Duration != null) pose.Duration = parseDuration(pose.Duration)
    if (pose.Rebound?.Duration != null) pose.Rebound.Duration = parseDuration(pose.Rebound.Duration)
  }
}

// Returns { ok: true, data } or { ok: false, errors: string[] }
export function validateTrack(yamlContent) {
  let data
  try {
    data = YAML.parse(yamlContent)
  } catch (e) {
    return { ok: false, errors: [`YAML parse error – ${e.message}`] }
  }
  normalizeDurations(data)
  if (!validate(data)) {
    const errors = validate.errors.map(err => {
      let p = err.instancePath
      if (err.keyword === 'required') p += '/' + err.params.missingProperty
      else if (err.keyword === 'additionalProperties') p += '/' + err.params.additionalProperty
      return `${p || '(root)'}: ${err.message}`
    })
    return { ok: false, errors }
  }
  return { ok: true, data }
}
