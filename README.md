# Leonida Trophy Guide — GTA VI, all 55 trophies

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/robyaryansah42-art/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/robyaryansah42-art/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A free, open-source, fully offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official name, description and grade, a guide written for this page in its own words with its source named, and a place in a three-stage roadmap to the platinum. Tick trophies off as you earn them — your progress, counters and notes stay in your browser and the page never touches the network.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080. There is no build step: `app/` is plain static files — HTML, ES modules, CSS and JSON.

## What it does

- **The full official list** — 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden on PlayStation until earned — in `app/data/trophies.json`, taken from the list as PlayStation publishes it (Exophase, cross-checked with PSNProfiles, 18 November 2026).
- **A guide for every trophy**, written for this page, each naming its source beside it. Five trophies are marked honestly as "method not yet known": at launch, PowerPyx had not pinned down how they unlock, and this guide says so rather than inventing a method.
- **A roadmap to the platinum** in three stages — story (60–80 hours), 100% Completion and the big counters (about 100 hours), cleanup — with per-stage progress, plus a **Next up** planner that points at the earliest unearned trophies in roadmap order.
- **The missable trophy, flagged loud**: Positive Mental Attitude (meditate at every spot). Its first meditation, at Jason's house in Chapter 1, is gone for good once that chapter ends. The guide warns you before you get there.
- **A tracker that saves**: tick trophies off, set counters on the counted ones (stunts, vehicles, WAiNK spots…), jot notes per trophy. Everything persists in localStorage, with export to a file and import back.
- **Filters and a spoiler setting**: filter by kind (story, missable, collectibles, activities, moments — there are no online trophies, all 55 are single-player) and by grade, sort by roadmap, grade, name or unearned-first, search across names, descriptions and guides, and hide story trophies' names and descriptions until they are earned.
- **Offline and original**: the app loads nothing from the network, uses no Rockstar logo, artwork or game screenshots, and ships a dark theme with a light one a click away.

## Sources

- Official trophy list (names, descriptions, grades) as shown on PlayStation Network, via Exophase and PSNProfiles, taken 18 November 2026.
- PowerPyx — GTA 6 Trophy Guide &amp; Roadmap: https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/
- GTABase — cited in the trophy-list round-ups for the missable flag and the cheat warning.
- Planet GTA 6 — trophy list: https://www.planetgta6.com/en/gta-6-trophies/

## How it is handed in

`main.ts` at the repo root is the entry program: it checks `app/data/trophies.json` holds 55 trophies with guides, copies `app/` and `screenshots/` to `/output`, and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (the kit's copy, unchanged). Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`shots.json` records the four screenshot scenes (tracker with a guide open, roadmap, spoiler mode, the missable trophy) at 1280×800. The scenes use URL seeds the app understands: `?earned=1,2,3` ticks trophies off, `?open=28` opens one trophy's guide in the detail pane, `?kind=story` picks a filter, and `?spoiler=on` / `?spoiler=off` sets the spoiler setting — handy for trying states without clicking through the page.

## Layout

```
main.ts                  entry program (Node 22, stdlib only)
serve.ts                 tiny static server for trying the guide locally
app/
  index.html             the page
  style.css              night-drive theme (+ light variant)
  js/
    main.js              boot + toolbar wiring
    catalog.js           labels, filters, sorting, roadmap, planner
    state.js             saved progress, export/import, URL seeds
    views.js             scoreboard, roadmap, checklist, detail pane
  data/trophies.json      the 55 trophies with guides and sources
screenshots/             4 renders of the guide's own code
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=sxjvzha4&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
