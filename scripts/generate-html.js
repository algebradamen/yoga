/**
 * @fileoverview Generates static HTML pages from parsed track JSON files.
 *
 * Reads all `.json` files from the `generated/` directory (produced by
 * `parse-track-yaml.js`), renders each track into a full HTML page with a
 * pose table, and writes the output to `dist/<track-name>/index.html`.
 * Locale variants (e.g. `track.NO.json`) are written as `index.no.html` etc.
 * Also renders a `dist/index.html` listing all tracks.
 *
 * Usage: `node scripts/generate-html.js`
 */

import fs from 'fs'
import path from 'path'
import markdownit from 'markdown-it'
import { makeT } from './i18n.js'

const md = markdownit()
const root = path.resolve('./scripts', '..')
const generatedDir = path.join(root, 'generated')
const distDir = path.join(root, 'dist')

// Locale metadata: display label and html lang attribute
const LOCALES = {
  en: { label: 'EN', lang: 'en' },
  no: { label: 'NO', lang: 'no' },
  es: { label: 'ES', lang: 'es' },
}

function localeOutputFile(locale) {
  return locale === 'en' ? 'index.html' : `index.${locale}.html`
}

// Parse a JSON filename into { baseName, locale }
// e.g. "yin-60-track.NO.json" → { baseName: "yin-60-track", locale: "no" }
// e.g. "yin-60-track.json"    → { baseName: "yin-60-track", locale: "en" }
function parseFilename(file) {
  const noExt = file.replace(/\.json$/, '')
  const match = noExt.match(/\.([A-Z]{2})$/)
  if (match) {
    return { baseName: noExt.slice(0, -(match[0].length)), locale: match[1].toLowerCase() }
  }
  return { baseName: noExt, locale: 'en' }
}

function renderLangSwitcher(availableLocales, currentLocale) {
  return availableLocales.map(locale => {
    const { label } = LOCALES[locale] ?? { label: locale.toUpperCase() }
    const href = localeOutputFile(locale)
    return locale === currentLocale
      ? `<a href="${href}" class="active" aria-current="page">${label}</a>`
      : `<a href="${href}">${label}</a>`
  }).join('\n    ')
}

function renderPose(pose, t) {
  const meridianBadges = Array.isArray(pose.Meridians)
    ? pose.Meridians.map(m => `<span class="badge badge-meridian">${m}</span>`).join('')
    : ''
  return `
    <details class="pose-item">
      <summary>
        <div class="pose-name-cell">
          <span class="chevron"></span>
          ${pose.Name}
        </div>
        <span class="col-duration duration-cell">${pose.Duration ? pose.Duration + ' min' : ''}</span>
        <div class="col-meridians badges">${meridianBadges}</div>
        <span class="col-sensation sensation-cell">${pose.Sensation ? pose.Sensation.join(' · ') : ''}</span>
      </summary>
      <div class="detail-inner">
        <h3>${pose.Name}</h3>
        ${pose.Description ? `<div>${md.render(pose.Description)}</div>` : ''}
        <div class="mobile-info">
          ${pose.Sensation ? `<div class="alt-section"><h4>${t('detail_sensation')}</h4><ul>${pose.Sensation.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        </div>
        ${pose.Rebound ? `
        <div class="alt-section">
          <h4>${t('detail_rebound')} – ${pose.Rebound.Duration} min</h4>
          <p>${pose.Rebound.Description}</p>
        </div>` : ''}
        ${pose.Alternatives ? pose.Alternatives.map(a => `
        <div class="alt-section">
          <h4>${t('detail_alternative')}: ${a.Name}</h4>
          ${a.Description ? `<div class="alt-item">${md.render(a.Description)}</div>` : ''}
        </div>`).join('') : ''}
      </div>
    </details>`
}

function renderTrack(track, locale, availableLocales, warnings) {
  const { lang } = LOCALES[locale] ?? { lang: locale }
  const t = makeT(locale, warnings)
  const langSwitcher = renderLangSwitcher(availableLocales, locale)
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${track.Name}</title>
  <link rel="stylesheet" href="../styles/yoga.css" />
</head>
<body>

<!-- ===== TOP DECORATION ===== -->
<div class="deco-top" aria-hidden="true">
  <img src="../images/deco-top.svg" width="340" height="60" alt=""/>
  <nav class="lang-switcher" aria-label="Language">
    ${langSwitcher}
  </nav>
</div>

<!-- ===== MAIN ===== -->
<main>
  <h1>${track.Name} – ${track.Duration} min</h1>
  ${track.Description ? `<div class="subtitle">${md.render(track.Description)}</div>` : ''}

  <div class="pose-table-wrapper">
    <div class="pose-header">
      <span class="col-pose">${t('col_pose')}</span>
      <span class="col-duration">${t('col_duration')}</span>
      <span class="col-meridians">${t('col_meridians')}</span>
      <span class="col-sensation">${t('col_sensation')}</span>
    </div>

    ${track.Poses.map(pose => renderPose(pose, t)).join('')}

  </div>
</main>

<!-- ===== BOTTOM DECORATION ===== -->
<div class="deco-bottom" aria-hidden="true">
  <img src="../images/deco-bottom.svg" width="340" height="60" alt=""/>
</div>

</body>
</html>`
}

function renderIndex(tracks, warnings) {
  const t = makeT('en', warnings)
  const items = tracks
    .map(({ baseName, track }) => `
    <div class="pose-item" style="padding: 0.75rem 1rem;">
      <a href="${baseName}/">${track.Name}</a>
    </div>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml" />
  <title>Edita's Yoga &amp; Pilates Sessions</title>
  <link rel="stylesheet" href="styles/yoga.css" />
</head>
<body>

<!-- ===== TOP DECORATION ===== -->
<div class="deco-top" aria-hidden="true">
  <img src="images/deco-top.svg" width="340" height="60" alt=""/>
</div>

<!-- ===== MAIN ===== -->
<main>
  <h1>Edita's Yoga &amp; Pilates Sessions</h1>

  <div class="pose-table-wrapper">
    <div class="pose-header" style="grid-template-columns: 1fr;">
      <span class="col-pose">${t('col_session')}</span>
    </div>
    ${items}
  </div>
</main>

<!-- ===== BOTTOM DECORATION ===== -->
<div class="deco-bottom" aria-hidden="true">
  <img src="images/deco-bottom.svg" width="340" height="60" alt=""/>
</div>

</body>
</html>`
}

// ── Main ──────────────────────────────────────────────────────────────────────

const jsonFiles = fs.readdirSync(generatedDir).filter(f => f.endsWith('.json'))

if (jsonFiles.length === 0) {
  console.log('No JSON files found in generated/. Run parse-track-yaml.js first.')
  process.exit(0)
}

fs.mkdirSync(distDir, { recursive: true })

// Group files by base track name, collecting locale variants
// groups: Map<baseName, Map<locale, track>>
const groups = new Map()
for (const file of jsonFiles) {
  const { baseName, locale } = parseFilename(file)
  const track = JSON.parse(fs.readFileSync(path.join(generatedDir, file), 'utf-8'))
  if (!groups.has(baseName)) groups.set(baseName, new Map())
  groups.get(baseName).set(locale, track)
}

// Render all locale variants for each track
const warnings = []
const indexTracks = []
for (const [baseName, localeMap] of groups) {
  const outDir = path.join(distDir, baseName)
  fs.mkdirSync(outDir, { recursive: true })

  // Sort locales so EN comes first, then alphabetically
  const availableLocales = [...localeMap.keys()].sort((a, b) =>
    a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)
  )

  for (const [locale, track] of localeMap) {
    const outFile = localeOutputFile(locale)
    const outPath = path.join(outDir, outFile)
    fs.writeFileSync(outPath, renderTrack(track, locale, availableLocales, warnings))
    console.log(`✓ ${baseName}.${locale}  →  dist/${baseName}/${outFile}`)
  }

  // Use the EN version for the index listing (fallback to first available)
  const indexTrack = localeMap.get('en') ?? localeMap.values().next().value
  indexTracks.push({ baseName, track: indexTrack })
}

const indexPath = path.join(distDir, 'index.html')
fs.writeFileSync(indexPath, renderIndex(indexTracks, warnings))
console.log(`✓ index  →  dist/index.html`)

if (warnings.length > 0) {
  console.warn('---')
  for (const w of warnings) console.warn(`  ⚠ ${w}`)
  console.warn('---')
}

// Copy static assets into dist so it can be served independently
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

const stylesDir = path.join(root, 'styles')
const imagesDir = path.join(root, 'images')
copyDir(stylesDir, path.join(distDir, 'styles'))
console.log(`✓ styles/  →  dist/styles/`)
copyDir(imagesDir, path.join(distDir, 'images'))
console.log(`✓ images/  →  dist/images/`)
