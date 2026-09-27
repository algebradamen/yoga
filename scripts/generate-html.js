/**
 * @fileoverview Generates static HTML pages from parsed track JSON files.
 *
 * Reads all `.json` files from the `generated/` directory (produced by
 * `parse-track-yaml.js`), renders each track into a full HTML page with a
 * pose table, and writes the output to `dist/<track-name>/`. Norwegian is the
 * default locale and is written as `index.html`; other locales are written as
 * `index.<locale>.html` (e.g. `index.en.html`). Also renders one front page per
 * locale (`dist/index.html`, `dist/index.en.html`, ...) listing every track;
 * tracks missing a locale fall back to the Norwegian version.
 *
 * All links are relative, so the site works at any base path.
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

// Locale metadata: display label and html lang attribute.
// Key order is the display order in the language switcher; the default comes first.
const DEFAULT_LOCALE = 'no'
const LOCALES = {
  no: { label: 'NO', lang: 'no' },
  en: { label: 'EN', lang: 'en' },
  es: { label: 'ES', lang: 'es' },
}
const LOCALE_ORDER = Object.keys(LOCALES)

function compareLocales(a, b) {
  const ia = LOCALE_ORDER.indexOf(a), ib = LOCALE_ORDER.indexOf(b)
  if (ia === -1 && ib === -1) return a.localeCompare(b)
  if (ia === -1) return 1
  if (ib === -1) return -1
  return ia - ib
}

function localeOutputFile(locale) {
  return locale === DEFAULT_LOCALE ? 'index.html' : `index.${locale}.html`
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

// homeHref: the front page in the current locale. The "flow with Edita"
// lettering links there.
function renderTopDeco(imgBase, langSwitcherHtml, homeHref, homeLabel) {
  return `<!-- ===== TOP DECORATION ===== -->
<header class="deco-top">
  <a class="home-link" href="${homeHref}" title="${homeLabel}" aria-label="${homeLabel}">
  <svg width="340" height="100" viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <path id="deco-wave" d="M5 78 Q40 58 80 63 Q120 68 160 48 Q200 28 260 38 Q300 46 335 33"/>
    </defs>
    <text font-family="'Dancing Script', cursive" font-size="36" font-weight="500" fill="#5c2e0f">
      <textPath href="#deco-wave">flow with Edita</textPath>
    </text>
  </svg>
  </a>
  <img class="olive-chain" src="${imgBase}olive-chain-concept.svg" width="340" height="100" alt="" aria-hidden="true"/>
  <nav class="lang-switcher" aria-label="Language">
    ${langSwitcherHtml}
  </nav>
</header>`
}

function renderBottomDeco(imgSrc) {
  return `<!-- ===== BOTTOM DECORATION ===== -->
<div class="deco-bottom" aria-hidden="true">
  <img src="${imgSrc}" width="340" height="60" alt=""/>
</div>`
}

// Locale variants of a page live in the same directory, so a bare filename is enough.
function renderLangSwitcher(availableLocales, currentLocale) {
  return availableLocales.map(locale => {
    const { label } = LOCALES[locale] ?? { label: locale.toUpperCase() }
    const href = localeOutputFile(locale)
    return locale === currentLocale
      ? `<a href="${href}" class="active" aria-current="page">${label}</a>`
      : `<a href="${href}">${label}</a>`
  }).join('\n    ')
}

function renderSection(section) {
  return `
    <h2 class="pose-section">${section.Section}</h2>`
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
        ${pose.Instructions ? `
        <div class="alt-section">
          <h4>${t('detail_instructions')}</h4>
          <div>${md.render(pose.Instructions)}</div>
        </div>` : ''}
        <div class="mobile-info">
          ${meridianBadges ? `<div class="alt-section"><h4>${t('col_meridians')}</h4><div class="badges">${meridianBadges}</div></div>` : ''}
          ${pose.Sensation ? `<div class="alt-section"><h4>${t('detail_sensation')}</h4><ul>${pose.Sensation.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        </div>
        ${pose.Adjustments ? `
        <div class="alt-section">
          <h4>${t('detail_adjustments')}</h4>
          <div>${md.render(pose.Adjustments)}</div>
        </div>` : ''}
        ${pose.TeacherCues ? `
        <div class="alt-section">
          <h4>${t('detail_teacher_cues')}</h4>
          <div>${md.render(pose.TeacherCues)}</div>
        </div>` : ''}
        ${pose.Counterpose ? `
        <div class="alt-section">
          <h4>${t('detail_counterpose')}: ${pose.Counterpose.Name}</h4>
          ${pose.Counterpose.Description ? `<div class="alt-item">${md.render(pose.Counterpose.Description)}</div>` : ''}
        </div>` : ''}
        ${pose.Transition ? `
        <div class="alt-section">
          <h4>${t('detail_transition')}</h4>
          <p>${pose.Transition}</p>
        </div>` : ''}
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

function renderTrack(track, locale, availableLocales, baseName, warnings) {
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

${renderTopDeco('../images/', langSwitcher, `../${localeOutputFile(locale)}`, t('home_link'))}

<!-- ===== MAIN ===== -->
<main>
  <div class="page-header">
    <h1>${track.Name} – ${track.Duration} min</h1>
    <button class="print-btn" onclick="window.print()" title="${t('print_tooltip')}" aria-label="${t('print_tooltip')}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    </button>
  </div>
  ${track.Description ? `<div class="subtitle">${md.render(track.Description)}</div>` : ''}

  <div class="pose-table-wrapper">
    <div class="pose-header">
      <span class="col-pose">${t('col_pose')}</span>
      <span class="col-duration">${t('col_duration')}</span>
      <span class="col-meridians">${t('col_meridians')}</span>
      <span class="col-sensation">${t('col_sensation')}</span>
    </div>

    ${track.Poses.map(item => 'Section' in item ? renderSection(item) : renderPose(item, t)).join('')}

  </div>
</main>

${renderBottomDeco('../images/deco-bottom.svg')}

<script>
  // Browsers never print the contents of closed <details>, so open every pose
  // before printing and close the ones we opened afterwards.
  (() => {
    let opened = []
    addEventListener('beforeprint', () => {
      opened = [...document.querySelectorAll('details.pose-item:not([open])')]
      opened.forEach(d => { d.open = true })
    })
    addEventListener('afterprint', () => {
      opened.forEach(d => { d.open = false })
      opened = []
    })
  })()
</script>

</body>
</html>`
}

function renderIndex(tracks, locale, availableLocales, warnings) {
  const { lang } = LOCALES[locale] ?? { lang: locale }
  const langSwitcher = renderLangSwitcher(availableLocales, locale)
  const t = makeT(locale, warnings)
  // tracks: Array<{ baseName, track, trackLocale }>; trackLocale differs from
  // locale when the track has no translation and falls back to another language.
  const cards = tracks
    .map(({ baseName, track, trackLocale }) => `
  <a class="session-card" href="${baseName}/${localeOutputFile(trackLocale)}"${trackLocale !== locale ? ` hreflang="${LOCALES[trackLocale]?.lang ?? trackLocale}"` : ''}>
    <div class="session-card-header">
      <h2>${track.Name}</h2>
      <span class="session-meta">
        ${trackLocale !== locale ? `<span class="session-lang">${LOCALES[trackLocale]?.label ?? trackLocale.toUpperCase()}</span>` : ''}
        <span class="session-duration">${track.Duration} min</span>
      </span>
    </div>
    ${track.Description ? `<div class="session-card-description">${md.render(track.Description)}</div>` : ''}
  </a>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="images/favicon.svg" type="image/svg+xml" />
  <title>Edita's Yoga &amp; Pilates Sessions</title>
  <link rel="stylesheet" href="styles/yoga.css" />
    <!-- Basic visitor tracking - privacy-friendly, GDPR-compliant, European -->
  <script>
      window.goatcounter = {
          path: function(p) { return location.host + p }
      }
  </script>
    <script data-goatcounter="https://dv8.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>

    <!-- Another privacy-friendly, GDPR-compliant, European tracker - remove goatcounter when this works properly. -->
    <script defer src="https://m.dv8.no/script.js" data-website-id="928b230a-7852-4ce3-a711-4b08d9a7ff6a"></script>

</head>
<body>

${renderTopDeco('images/', langSwitcher, localeOutputFile(locale), t('home_link'))}

<!-- ===== MAIN ===== -->
<main>
  <h1>Edita's Yoga &amp; Pilates Sessions</h1>
  <div class="session-grid">
    ${cards}
  </div>
</main>

${renderBottomDeco('images/deco-bottom.svg')}

</body>
</html>`
}

// ── Main ──────────────────────────────────────────────────────────────────────

const jsonFiles = fs.readdirSync(generatedDir).filter(f => f.endsWith('.json'))

if (jsonFiles.length === 0) {
  console.log('No JSON files found in generated/. Run parse-track-yaml.js first.')
  process.exit(0)
}

// Clean dist so stale locale files from deleted/renamed tracks don't linger
fs.rmSync(distDir, { recursive: true, force: true })
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

for (const [baseName, localeMap] of groups) {
  const outDir = path.join(distDir, baseName)
  fs.mkdirSync(outDir, { recursive: true })

  const availableLocales = [...localeMap.keys()].sort(compareLocales)

  for (const [locale, track] of localeMap) {
    const outFile = localeOutputFile(locale)
    const outPath = path.join(outDir, outFile)
    fs.writeFileSync(outPath, renderTrack(track, locale, availableLocales, baseName, warnings))
    console.log(`✓ ${baseName}.${locale}  →  dist/${baseName}/${outFile}`)
  }

}

// All locales that exist across all tracks, in switcher order
const allLocales = [...new Set([...groups.values()].flatMap(m => [...m.keys()]))].sort(compareLocales)

// Pick the version of a track to show on a locale's front page: the matching
// translation if there is one, otherwise the default locale, otherwise any.
function pickTrackLocale(localeMap, locale) {
  if (localeMap.has(locale)) return locale
  if (localeMap.has(DEFAULT_LOCALE)) return DEFAULT_LOCALE
  return [...localeMap.keys()].sort(compareLocales)[0]
}

// Render one front page per locale listing every track
for (const locale of allLocales) {
  const indexTracks = [...groups].map(([baseName, localeMap]) => {
    const trackLocale = pickTrackLocale(localeMap, locale)
    return { baseName, track: localeMap.get(trackLocale), trackLocale }
  })
  const outFile = localeOutputFile(locale)
  const indexPath = path.join(distDir, outFile)
  fs.writeFileSync(indexPath, renderIndex(indexTracks, locale, allLocales, warnings))
  console.log(`✓ index.${locale}  →  dist/${outFile}`)
}

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
