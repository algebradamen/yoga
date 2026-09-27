# CLAUDE.md

Static site generator for Edita's yoga and pilates class guides. YAML session files → validated JSON → multilingual static HTML. Live at https://yoga.algebradamen.no (GitHub Pages). `SPEC.md` is the behaviour spec; `README.md` is the user guide. Keep both up to date when behaviour changes.

## Commands

```sh
npm run generate     # full build: YAML → generated/*.json → dist/
npm run validate     # schema-check YAML only
npm run watch        # build + serve on http://localhost:3000, rebuild on change
npm run translate    # NO → EN/ES via Claude (writes files, never commits)
```

There are no tests. After any change, run `npm run generate` and make sure it exits 0. Four duration warnings are known and accepted: Pilates Odda and heart-kidney NO/EN are a few minutes short, and Pilates 1 og yin 1 has no pose timings yet.

## Deployment

Push to `main` = deploy (`.github/workflows/deploy.yml`, GitHub Pages). A failing build blocks the deploy. Codeberg is no longer used; don't reintroduce Codeberg files or remotes.

## Content conventions

- **Norwegian is the source.** Edit `*.NO.yaml`; `*.EN.yaml` / `*.ES.yaml` come from `npm run translate`. When changing structure (not wording) of a NO file, make the same structural change in its translations.
- Session files live in the repo root. The filename without `.NO.yaml` becomes the URL path, so renaming a file changes the public URL.
- Unknown fields fail validation. Adding a field means updating `track.schema.json`, the renderer in `scripts/generate-html.js`, the field list in `SPEC.md`, and the field list in the prompt in `scripts/translate-tracks.js`.
- A `Poses` item can be a section heading (`- Section: "YIN"`) instead of a pose.
- Durations may use a decimal comma (`0,5`). Pose durations must add up to the session `Duration` within 10% or the build fails; rebounds don't count.
- The loose files `Pilates Odda.pdf`, `Pilates-1-og-yin-1.docx`, `Yin yoga 60 minutter.docx` and `yin-60-heart-kidney-meridian.md` are Edita's original notes, kept for reference. They are not part of the build.

## Code conventions

- Node ESM, no framework, no bundler. HTML is built with template literals in `scripts/generate-html.js`.
- Browser JavaScript lives in `js/` (copied to `dist/js/`) and must work without a build step. `js/pose-nav.js` drives the Next button in each exercise. Teacher mode (`js/teacher-mode.js`, Play button currently hidden) reads the rendered page (`details.pose-item`, `.pose-section`, `.duration-cell`, `h3`), so keep those class names stable or update both together.
- UI strings go in `scripts/i18n.js` for all three locales (`no`, `en`, `es`).
- Keep every generated link relative (no leading `/`).
- Colors are CSS custom properties in `styles/yoga.css`; print styles live in the `@media print` block at the end.
- `generated/` and `dist/` are build output and gitignored; never edit them by hand.
- `api-key.txt` holds a local Anthropic key and is gitignored; never read it into output or commit it.

## Checking changes visually

`npm run watch` (or `npm run generate && npx serve dist`) serves the site locally. Headless Chromium is available for screenshots and print checks, for example:

```sh
chromium --headless --screenshot=out.png --window-size=390,1500 http://localhost:3000/yin-60-track/
chromium --headless --no-pdf-header-footer --print-to-pdf=out.pdf http://localhost:3000/yin-60-track/
```
