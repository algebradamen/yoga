Specification
===

## Overview

Static site generator for yoga and pilates session guides. YAML source files are validated, parsed to JSON, then rendered into multilingual static HTML pages.

## Source format

Each session is described by a YAML file in the project root. Norwegian is the canonical source language. File naming:

| File | Language |
|---|---|
| `my-session.NO.yaml` | Norwegian (source) |
| `my-session.EN.yaml` | English |
| `my-session.ES.yaml` | Spanish |

The full schema is in `track.schema.json`. A session file contains:

- `Name` — session title (string)
- `Duration` — total duration in minutes (integer)
- `Description` — optional markdown text shown as a subtitle
- `Poses` — ordered list of poses, each with:
  - `Name` — pose name (string)
  - `Duration` — duration in minutes (integer, optional)
  - `Description` — markdown description shown in the expanded detail row
  - `Meridians` — list of meridian names (optional)
  - `Sensation` — list of sensation descriptions (optional)
  - `Rebound` — object with `Description` (string) and `Duration` (integer, minutes); rebound duration is **not** counted toward the session total
  - `Alternatives` — list of objects with `Name` and optional `Description`

The parse script validates all files against the schema and warns if pose durations deviate from the stated session duration by more than 10% (and fails if deviation exceeds 10%).

## Build pipeline

```
*.NO.yaml / *.yaml / *.ES.yaml
        ↓  parse-track-yaml.js  (schema validation, duration check)
   generated/*.json
        ↓  generate-html.js
      dist/
```

Run with `npm run generate`. The `generated/` and `dist/` directories are not committed.

## Internationalisation

Norwegian (`no`) is the default locale — `index.html` in every directory is the Norwegian version.

| Locale | Output file |
|---|---|
| `no` | `index.html` |
| `en` | `index.en.html` |
| `es` | `index.es.html` |

UI strings (column headers, section labels, tooltips) are defined in `scripts/i18n.js`. If a locale or key is missing, the English value is used and a warning is emitted.

The front page (`dist/index.html`) is also generated per locale, with each card linking to the matching locale's session page. A language switcher in the top bar links between all available locales.

## Layout and design

Colors are olive and forest green on a sage background, with a warm terracotta footer. Shared styles live in `styles/yoga.css`.

The session page uses an expandable table layout:

- **Columns:** Pose · Duration · Meridians · Sensation
- On **mobile**, Meridians and Sensation columns are hidden; they appear in the expanded detail section instead.
- Each row expands to show the full pose description, rebound section, and alternatives.

The front page shows session cards with the title, duration badge, and description.

A discrete **print button** (printer icon, top-right of the session title) calls `window.print()`. The browser print dialog lets the user print or save as PDF. The button is hidden in print output. All poses are expanded in print view.

## Translation workflow

`npm run translate` (see `scripts/translate-tracks.js`) reads every `.NO.yaml` file and calls `claude --print --dangerously-skip-permissions` once per target language, piping the prompt via stdin. It writes the translated YAML and prints a proposed `git commit` command but does not commit.

Requires `ANTHROPIC_API_KEY` in the environment. A manual GitHub Actions workflow (`.github/workflows/translate.yml`) automates this in CI using a repository secret.

## CSS conventions

- `styles/yoga.css` is the single shared stylesheet, copied into `dist/styles/` at build time.
- Session pages reference it as `../styles/yoga.css`; the front page as `styles/yoga.css`.
- CSS custom properties (defined on `:root`) are used for all colors.
- Print styles are in a `@media print` block at the end of the file.
