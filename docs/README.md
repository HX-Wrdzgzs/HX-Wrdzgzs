# Personal Homepage

A dependency-free personal homepage for `HX-Wrdzgzs`.

## Files

- `index.html` — homepage content and semantic structure
- `styles.css` — visual system, responsive layout and motion
- `script.js` — reveal effects, active navigation and pointer glow
- `404.html` — matching 404 page

## Design direction

The page intentionally avoids a conventional résumé/portfolio layout.

Core ideas:

- dark, quiet, technical visual language
- projects before skill badges
- muted Mizuki-inspired mauve/purple accents instead of a full pink theme
- a personal digital-lab identity spanning software, infrastructure and amateur radio
- no external UI framework, icon package or font dependency
- responsive layout and `prefers-reduced-motion` support

## GitHub Pages

After merging this branch, GitHub Pages can serve the site directly from the repository's `docs/` directory:

1. Open repository **Settings**.
2. Open **Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select the default branch and `/docs`.
5. Save.

All internal assets use relative paths so the site can work as a project Pages site without assuming a root-domain deployment.

## Content sources

Project descriptions are based on the public repositories and the profile README. The homepage deliberately keeps descriptions short and does not expose private repository details.
