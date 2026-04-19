/**
 * @fileoverview Generates static HTML pages from parsed track JSON files.
 *
 * Reads all `.json` files from the `generated/` directory (produced by
 * `parse-track-yaml.js`), renders each track into a full HTML page with a
 * pose table, and writes the output to `dist/<track-name>/index.html`.
 * Also renders a `dist/index.html` listing all tracks.
 *
 * Usage: `node scripts/generate-html.js`
 */

import fs from 'fs'
import path from 'path'
import markdownit from 'markdown-it'

const md = markdownit()
const root = path.resolve('./scripts', '..')
const generatedDir = path.join(root, 'generated')
const distDir = path.join(root, 'dist')

function renderPose(pose) {
  const meridianBadges = Array.isArray(pose.Meridians)
    ? pose.Meridians.map(m => `<span class="badge badge-meridian">${m}</span>`).join('')
    : ''
  const altBadge = pose.Alternatives
    ? `<span class="badge badge-alt">${pose.Alternatives.Name}</span>`
    : ''
  return `
    <details class="pose-item">
      <summary>
        <div class="pose-name-cell">
          <span class="chevron"></span>
          ${pose.Name}
        </div>
        <span class="col-duration duration-cell">${pose.Duration ? pose.Duration + ' min' : ''}</span>
        <div class="col-alternatives badges">${altBadge}</div>
        <div class="col-meridians badges">${meridianBadges}</div>
        <span class="col-sensation sensation-cell">${pose.Sensation || ''}</span>
      </summary>
      <div class="detail-inner">
        <h3>${pose.Name}</h3>
        ${pose.Description ? `<div>${md.render(pose.Description)}</div>` : ''}
        <div class="mobile-info">
          ${pose.Sensation ? `<div class="alt-section"><h4>Sensation</h4><p>${pose.Sensation}</p></div>` : ''}
        </div>
        ${pose.Alternatives ? `
        <div class="alt-section">
          <h4>Alternative: ${pose.Alternatives.Name}</h4>
          ${pose.Alternatives.Description ? `<div class="alt-item">${md.render(pose.Alternatives.Description)}</div>` : ''}
        </div>` : ''}
      </div>
    </details>`
}

function renderTrack(track) {
  return `<!DOCTYPE html>
<html lang="en">
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
    <a href="index.html" class="active" aria-current="page">EN</a>
    <a href="index.no.html">NO</a>
  </nav>
</div>

<!-- ===== MAIN ===== -->
<main>
  <h1>${track.Name} – ${track.Duration} min</h1>
  ${track.Description ? `<div class="subtitle">${md.render(track.Description)}</div>` : ''}

  <div class="pose-table-wrapper">
    <div class="pose-header">
      <span class="col-pose">Pose</span>
      <span class="col-duration">Duration</span>
      <span class="col-alternatives">Alternatives</span>
      <span class="col-meridians">Meridians</span>
      <span class="col-sensation">Sensation</span>
    </div>

    ${track.Poses.map(pose => renderPose(pose)).join('')}

  </div>
</main>

<!-- ===== BOTTOM DECORATION ===== -->
<div class="deco-bottom" aria-hidden="true">
  <img src="../images/deco-bottom.svg" width="340" height="60" alt=""/>
</div>

</body>
</html>`
}

function renderIndex(tracks) {
  const items = tracks
    .map(({ name, track }) => `
    <div class="pose-item" style="padding: 0.75rem 1rem;">
      <a href="${name}/">${track.Name}</a>
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
      <span class="col-pose">Session</span>
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

const tracks = []
for (const file of jsonFiles) {
  const track = JSON.parse(fs.readFileSync(path.join(generatedDir, file), 'utf-8'))
  const name = file.replace(/\.json$/, '')
  const outDir = path.join(distDir, name)
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'index.html')
  fs.writeFileSync(outPath, renderTrack(track))
  console.log(`✓ ${file}  →  dist/${name}/index.html`)
  tracks.push({ name, track })
}

const indexPath = path.join(distDir, 'index.html')
fs.writeFileSync(indexPath, renderIndex(tracks))
console.log(`✓ index  →  dist/index.html`)

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

