Description of content
===

On the top-level of this repository is a list of yoga lessons, e.g. `yin-60-track.md`.

Each Markdown file describes a yoga session, and contains a list of
yoga poses, with some or all of this information:

- The name of the pose
- Duration of the pose in minutes
- Alternative poses, e.g. if the pose is too difficult or painful
- Meridians that are affected by the pose
- Sensation

Target
=== 

For each top-level Markdown file, such as `yin-60-track.md`, we want to create a similarly named directory, e.g.
`yin-60-track`.

Inside that folder, there should be web pages corresponding to the yoga lesson.

If alternatives and/or meridians are missing from the yoga lesson, find alternatives and meridians on the web.

The yoga lesson should be presented in a table format, with columns for the pose name, duration, alternatives,
meridians, and sensation. Each row in the table represents a different pose.

When we expand a row, we should see a textual description of the pose. After this, a     
corresponding description of the alternative poses should be appended.



Layout / Design
===

Use bright yoga-inspired colors, such as pastel pinks background, purples like lavender flowers, and green like olive
leaves.
Lavender flower on the top of the page, and olive leaves on the bottom.
The table should have a clean and modern
design, with clear typography and ample spacing. Each row should have a subtle hover effect to indicate interactivity.
The expanded section should be visually distinct, perhaps with a different background color or a border to separate it
from the main table. The "Meridians" and "Alternatives" columns should use icons or badges to make the information
easily scannable.


Internationalisation
===

The main page for each yoga lesson should be named `index.html` and available in English, and the same content should be
available in Norwegian on a separate page.

Locale variants use the naming convention `index.[locale].html` (e.g. `index.no.html` for Norwegian).
Each page includes a discrete language-switcher link in the top-right corner.

Each page should be available in English and Norwegian. The content of the yoga lessons should be the same in both
languages, but the descriptions of the poses should be translated to Norwegian.


CSS
===

Shared styles live in `styles/yoga.css` at the project root, referenced from lesson pages as `../styles/yoga.css`.