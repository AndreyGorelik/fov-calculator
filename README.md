# FOV Calculator

Field of view calculator for sim racing. Pick your screen, distance and setup, and get the correct FOV value for 16 games.

Formulas and the game table are taken unchanged from [dinex86/FOV-Calculator](https://github.com/dinex86/FOV-Calculator) (MIT License, © 2018–2022 Markus Ewert and all contributors). This version has a new design and a to-scale top-down view of the rig.

## Languages

The site is built in 13 languages: one page per language (`/`, `/de/`, `/ru/`, `/ja/` …).

- `src/template.html` is the page, with `{{key}}` placeholders for text.
- `src/i18n/<code>.json` holds the text for each language (`en.json` is the source).
- `build.mjs` writes `index.html`, every `<code>/index.html` and `sitemap.xml`.

After changing the template or a translation, run `node build.mjs` and commit the generated files.
