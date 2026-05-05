# Edita's Yoga & Pilates Sessions

Static site generator for yoga and pilates session guides. Source data lives in YAML files; the build pipeline validates, parses, and renders them into multilingual HTML pages.

## Quick start

```sh
npm install
npm run watch        # generate + serve, auto-rebuild on changes
```

Browse to the URL printed by `serve` (usually http://localhost:3000).

## npm scripts

| Script | Description |
|---|---|
| `npm run generate` | Parse YAML → JSON, then render HTML into `dist/` |
| `npm run generate:json` | YAML → JSON only (`generated/`) |
| `npm run generate:html` | JSON → HTML only (`dist/`) |
| `npm run serve` | Serve `dist/` locally |
| `npm run watch` | Generate + serve, rebuild on any YAML/script change |
| `npm run translate` | Translate `.NO.yaml` files to EN and ES via Claude CLI |

## Adding a new session

1. Create `my-session.NO.yaml` in the project root (Norwegian is the source language).
2. Run `npm run generate` — the session appears on the front page.
3. Run `npm run translate` to generate `my-session.EN.yaml` (English) and `my-session.ES.yaml` (Spanish).

See `track.schema.json` for the full YAML schema.

## Translating

`npm run translate` calls the Claude CLI (`claude --print`) once per file per target language and writes the results. It requires the `claude` CLI to be installed and authenticated (`ANTHROPIC_API_KEY` set in the environment).

To run translations automatically, see `.github/workflows/translate.yml` — trigger it manually from the Actions tab. Add `ANTHROPIC_API_KEY` as a repository secret first.

## Project layout

```
.
├── *.NO.yaml               # Session source files (Norwegian)
├── *.EN.yaml               # English translations (generated)
├── *.ES.yaml               # Spanish translations (generated)
├── track.schema.json       # AJV schema for YAML validation
├── styles/yoga.css         # Shared stylesheet
├── images/                 # Decorative SVGs and favicon
├── scripts/
│   ├── parse-track-yaml.js # YAML → JSON with schema validation
│   ├── generate-html.js    # JSON → HTML
│   ├── i18n.js             # UI string translations
│   ├── watch.js            # Dev watcher
│   └── translate-tracks.js # AI-assisted YAML translation
├── generated/              # Intermediate JSON (gitignored)
└── dist/                   # Output HTML site (gitignored)
```

## Output structure

```
dist/
├── index.html              # Front page (Norwegian, default)
├── index.en.html           # Front page (English)
├── index.es.html           # Front page (Spanish)
├── styles/yoga.css
├── images/
└── my-session/
    ├── index.html          # Norwegian (default)
    ├── index.en.html
    └── index.es.html
```
