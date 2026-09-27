# TODO

## Pilates 1 og yin 1 (`pilates-1-og-yin-1.NO.yaml`) — structural issues

Found in a review on 2026-09-27. Nothing has been changed yet. Line numbers refer to the file at that time.

### Labels in the middle of a paragraph

Repetitions, "Startposisjon" and "Utførelse" run together in one paragraph:

- [ ] **Heel slides** (line 31): "6 pust på hver side Startposisjon: … Utførelse: …", no full stop before "Startposisjon".
- [ ] **Dead bug - en side om gangen** (line 47): same pattern.
- [ ] **Cat and cow** (line 57): "Startposisjon: …" and "Utførelse: …" in one paragraph.
- [ ] **Criss-Cross** (line 133): same, and "6 pust på hver side. Bekkenplassering: Innprint" is tucked in at the very end.

### Inconsistent structure between exercises

- [ ] **Bold vs plain labels:** Pelvic tilt, both Chest Lifts and Landing use bold labels (`**Startposisjon:**`); most others are plain. Stående balanseøvelse mixes both (plain "Startposisjon", bold "Utførelse").
- [ ] **Different label words:** Swømmer uses "Utgangsposisjonen" instead of "Startposisjon" and has no "Utførelse" label. Squat and One leg Circle have no labels at all.
- [ ] **Repetitions placed differently:** first in some exercises, in the middle or last in others.
  - Stående balanseøvelse puts "Balanse øvelse. 6 repetisjoner på hver side." between start position and execution, and says "6 repetisjoner" again inside the execution.
  - C kurve hides "5 repetisjoner" inside the execution.
- [ ] **Landing mixes two things:** arriving on the mat and a breathing exercise. The "Utførelse" belongs to the unnamed breathing exercise (in Pilates Odda that is its own exercise, "Introduksjon og pilates-pust").
- [ ] **Rett planke:** the "Startposisjon" text actually describes how to hold the plank.
- [ ] **Omvendt V posisjon:** the whole description is one sentence in parentheses, with no start position, execution or breath count.
- [ ] **C kurve:** two levels of "Utvidelse" (one inside the execution, one as its own paragraph). These could be `Alternatives`, which the site shows as separate sections.
- [ ] **Two exercises named "Chest Lift":** the second is the rotating variant; list rows and the Next button can't tell them apart.

### Text in the wrong field

- [ ] **Lowercase transitions:** five transitions start in lowercase after the "Overgang:" label was removed: "ta tak", "fra svømmeren", "gå hendene", "fra planken", "legg den ned".
- [ ] **Shavasana:** the last paragraph ("rull sakte over på høyre side … sett deg opp") is really a transition inside the description.
- [ ] **Roll up** sits in the transition after Omvendt V posisjon (kept there on purpose for now).

### Gaps compared with the other sessions

- [ ] **Timings:** no exercise has a duration, only the rebounds. The build warns until they are added.
- [ ] **Yin part:** no meridians or sensations, which the other Yin sessions have.
- [ ] **Sfinks:** only one rebound (head turned right). The Yin 60 document does Sphinx twice with a left and a right rebound; the left side may be missing.
- [ ] **Session description:** just the title again, with no theme like the other sessions.

### Spelling and wording (from the conversion, not yet fixed)

- [ ] "inprint" (Pelvic tilt title) and "Innprint" (Criss-Cross) — Pilates term is "Imprint".
- [ ] "Bevær" (Dead bug cue), "seo ver" (C kurve), "Swømmer" (title).
- [ ] Possibly wrong words: "send utilbake", "På siste holde" (Stående balanseøvelse), "legg den ned" (C kurve), "motsatt siden" (first Chest Lift), "Begge skuldrene er hviler gulvet" (both Recline twists), "lang fot" (Heel slides), "bøy og bak" (Squat cue).
- [ ] Missing words or punctuation: "skyver du høyre fot frem Pust ut" (Heel slides), "Strekk ryggen og hofter se om" (Child Pose), "Shavasana er avslutning av din praksis en naturlig del" (Shavasana).
- [ ] Punctuation and spacing: "nesa..og", "møtes.." (Landing), "kroppen ." (Heel slides), "side= 12" (Stående svømmer), "totalt- 6" (first Chest Lift), "totalt -6" (Swømmer), "fare- komme" (Child Pose), double spaces (Sfinks, Shavasana), mismatched quotes (Dead bug cue), lowercase "la" starting a sentence in the mantra.
- [ ] "fold forward" is English in Dangling.

## Site

- [ ] Rework teacher mode; its Play button is hidden (`SHOW_PLAY_BUTTON` in `scripts/generate-html.js`).
- [ ] Add pose timings to Pilates 1 og yin 1 (see above).
- [ ] Translate Pilates 60, Pilates Odda and Pilates 1 og yin 1 to English and Spanish (`npm run translate`).
- [ ] Old copy of the site is still served at https://narve.codeberg.page/yoga/ — delete the Codeberg `pages` branch or repository.
