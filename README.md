# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/robyaryansah42-art/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/robyaryansah42-art/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5: every trophy with its official name, description and grade, a guide in plain words that names its source, a three-stage roadmap to the platinum, the one missable trophy flagged, and a checklist that saves your progress in the browser.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network — `app/` is plain static files.

## What's inside

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze — with the official name, description and grade as PlayStation publishes them, in `app/data/trophies.json`.
- **A guide for every trophy**, written for this page in its own words, each naming its source beside it (official list, PowerPyx, GTABase, Planet GTA 6). Five trophies are marked honestly as "method not yet known" — PowerPyx had not pinned down how they unlock at launch, and this guide says so rather than inventing a method.
- **Roadmap to the platinum** — Stage 1 play the story (60–80 hours), Stage 2 100% Completion and challenges, Stage 3 cleanup. PowerPyx rates the set 4/10 and about 200 hours; one playthrough is enough.
- **The one missable trophy** — Positive Mental Attitude (meditate at every spot): the first meditation, at Jason's house in Chapter 1, becomes permanently unavailable after that chapter. There is no mission replay, so the guide tells you to keep manual saves.
- **Tracker** — tick trophies off, progress saves in localStorage, export to a file and import it back. Filters by kind (story, missable, collectibles, activities, moments, online — there are no online trophies, all 55 are single-player) and by grade, plus search. A spoiler setting hides story trophies' names and descriptions until they are earned.
- **Fully offline and original** — the app loads nothing from the network and uses no Rockstar logo, artwork or screenshots.

## Sources

- Official trophy list (names, descriptions, grades) as shown on PlayStation Network, via Exophase and PSNProfiles, taken 18 November 2026.
- PowerPyx — GTA 6 Trophy Guide &amp; Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- Planet GTA 6 — trophy list: https://www.planetgta6.com/en/gta-6-trophies/

## Handing it in

`main.ts` at the repo root copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (the kit's copy, unchanged). Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=sxjvzha4&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
