Specification
===

## Overview

Static site generator for yoga and pilates session guides. YAML source files are validated, parsed to JSON, then rendered into multilingual static HTML pages. The site is deployed to GitHub Pages at https://yoga.algebradamen.no.

## Source format

Each session is a YAML file in the project root. Norwegian is the canonical source language.

| File | Language |
|---|---|
| `my-session.NO.yaml` | Norwegian (source) |
| `my-session.EN.yaml` | English |
| `my-session.ES.yaml` | Spanish |
| `my-session.yaml` | No suffix: treated as English |

The full schema is in `track.schema.json`. Unknown fields fail validation. A session file contains:

- `Name` — session title (string, required)
- `Duration` — total duration in minutes (integer, required)
- `Description` — markdown, shown under the title and on the front-page card
- `Poses` — ordered list (required, at least one). An item is either a **section heading** or a **pose**.

A section heading is an item with only a `Section` field, e.g. `- Section: "YIN"`. It is shown as a full-width divider row in the pose table and is ignored by the duration check.

Each pose has:

| Field | Type | Shown on the site as |
|---|---|---|
| `Name` | string, required | Row title |
| `Duration` | number of minutes, decimals allowed | Duration column |
| `Description` | markdown | First part of the expanded row |
| `Instructions` | markdown | "Instructions" section |
| `Meridians` | list of strings | Meridians column (desktop) or expanded row (mobile) |
| `Sensation` | list of strings | Sensation column (desktop) or expanded row (mobile) |
| `Adjustments` | markdown | "Adjustments" section |
| `Counterpose` | object: `Name`, optional markdown `Description` | "Counterpose" section |
| `Transition` | plain text | "Transition" section |
| `Rebound` | object: `Description` (text), `Duration` (minutes) | "Rebound – N min" section |
| `Alternatives` | list of objects: `Name`, optional markdown `Description` | One "Alternative" section each |
| `TeacherCues` | markdown | "Teacher cues" section |

Durations may be written with a decimal comma (`0,5`); they are converted to numbers before validation.

### Duration check

The build adds up pose durations and compares the sum with the session `Duration`. Rebound durations are not counted.

- Difference up to 10%: a warning is printed and the session is built.
- Difference over 10%: the session is rejected and the build fails.
- No pose has a duration: the check is skipped with a warning, and the Duration column stays empty.

## Build pipeline

```
*.NO.yaml / *.EN.yaml / *.ES.yaml
        ↓  parse-track-yaml.js  (schema validation, duration check)
   generated/*.json
        ↓  generate-html.js
      dist/
```

Run with `npm run generate`. Both `generated/` and `dist/` are cleaned on each run and are not committed.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: it installs dependencies, runs `npm run generate` (a failing build is reported in the job summary and nothing is deployed) and publishes `dist/` to GitHub Pages. The custom domain is set in the repository's Pages settings; DNS for `yoga.algebradamen.no` is a CNAME to `algebradamen.github.io`.

## Internationalisation

Norwegian (`no`) is the default locale — `index.html` in every directory is the Norwegian version. Locales are listed in the order NO, EN, ES.

| Locale | Output file |
|---|---|
| `no` | `index.html` |
| `en` | `index.en.html` |
| `es` | `index.es.html` |

- **UI strings** (column headers, section labels, tooltips) are defined in `scripts/i18n.js`. If a locale or key is missing, the English value is used and a warning is emitted.
- **Session pages** have a language switcher listing only the languages that session exists in.
- **Front pages** are generated for every locale that any session exists in, and every front page lists every session. When a session has no translation for that locale, its card links to the Norwegian version (or, failing that, the first available one) and shows a small language tag such as **NO**.
- **All links are relative**, so the site works at the domain root, under a sub-path, or opened from disk.

## Layout and design

Colors are olive and forest green on a sage background, with a warm terracotta footer strip. Shared styles live in `styles/yoga.css`. The "flow with Edita" lettering uses the Dancing Script font from Google Fonts.

Every page has the same header: the "flow with Edita" lettering, an olive-branch decoration (hidden on mobile) and the language switcher. **Clicking "flow with Edita" goes to the front page** in the current language.

The front page shows session cards with the title, duration badge and description.

The session page uses an expandable table layout:

- **Columns:** Pose · Duration · Meridians · Sensation
- Section headings appear as full-width divider rows.
- Each pose row is a `<details>` element that expands to show the description and the sections listed in the field table above.
- On **mobile** (≤ 768px), the Meridians and Sensation columns are hidden; both appear inside the expanded row instead.

### Printing

A discrete **print button** (printer icon, top-right of the session title) calls `window.print()`; the browser print dialog lets the user print or save as PDF.

- A `beforeprint` handler opens every pose, and `afterprint` closes again the ones it opened, so the printout contains every description.
- A `::details-content` print rule does the same in browsers that support it.
- All four columns are shown; mobile-only duplicates, decorations, the language switcher and the print button are hidden; a pose is not split across pages.

## Analytics

Only the front pages load visitor tracking: GoatCounter (`dv8.goatcounter.com`) and Umami (`m.dv8.no`). Both are cookie-free. GoatCounter is meant to be removed once Umami is confirmed to work.

## Translation workflow

`npm run translate` (`scripts/translate-tracks.js`) reads every `.NO.yaml` file and asks Claude to translate it into English and Spanish, one request per file and language. Each result is validated with the same schema check as the build before it is written. Norwegian files are never modified, and nothing is committed; the script prints a suggested `git commit`.

- **Default backend:** the `claude` CLI (`claude --print`, prompt on stdin, 3-minute timeout). Uses the normal CLI login, or `ANTHROPIC_API_KEY`.
- **API backend:** `TRANSLATE_BACKEND=api`. Uses the Anthropic SDK with `ANTHROPIC_API_KEY`, falling back to `api-key.txt` (gitignored).

The manual **Translate tracks** GitHub Actions workflow (`.github/workflows/translate.yml`) runs the CLI backend with the `ANTHROPIC_API_KEY` repository secret, then commits all new and changed `.EN.yaml` / `.ES.yaml` files and pushes them to `main`, which triggers a deploy.

## CSS conventions

- `styles/yoga.css` is the single shared stylesheet, copied into `dist/styles/` at build time together with `images/`.
- Session pages reference it as `../styles/yoga.css`; front pages as `styles/yoga.css`.
- Colors are CSS custom properties on `:root`, except the header and footer gradient stops and the header lettering color.
- Print styles are in a `@media print` block at the end of the file.
