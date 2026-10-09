# Un:edited — working context for Claude Code

You're working with Ashmit on **Un:edited**, a free news reader that shows stories exactly as publishers wrote them, from outlets the reader picks. Android (APK), web (PWA) and iPhone (via the installable website). Motto: "Every story, as it was written."

The project has had five design passes on a claude.ai design canvas and an early Expo build. This folder holds a local copy of all of it.

## How to work here

- **Nothing is frozen.** `docs/current-config.md` describes where things stand today, not rules. Ashmit may change any of it: name, palette, fonts, screens, stack, scope. When Ashmit asks for a change, make it, then update `current-config.md` and add a line to `docs/changelog.md`.
- **Ask before deciding.** When a request touches something marked *open* or *proposed*, or when two sources disagree (see `current-config.md` §7), give the options with trade-offs in a sentence or two each and let Ashmit choose. Don't settle these yourself.
- **Talk first on big changes.** For anything that changes several screens or the stack, describe the plan in a few lines and wait for a go-ahead.
- **Keep the history.** Don't edit `docs/history/` — those are snapshots. Record changes in `changelog.md` instead.
- **Keep the brand rules unless told otherwise:** nothing reader-facing is AI-written; no "verified"/"fact-checked" claims; fictional outlet names in mockups; reduced-motion fallbacks for every animation.

## Where things are

| Path | What |
|---|---|
| `docs/current-config.md` | Current state of product, brand, tokens, screens, backend, build, plus open items and known conflicts. **Read this first.** |
| `docs/changelog.md` | Log of changes made from here on. |
| `docs/history/` | Original design doc and decisions log, as of 2026-10-07/08. |
| `design/screens/*.dc.html` | 76 screen files (mobile Paper + Ink, onboarding, tour, menus/states, notifications, sign out, web, web onboarding, landing, Hindi/Marathi, brand boards). Merged with Pass 6 on 2026-10-09. |
| `design/screens/fonts/` | Local woff2 files + `fonts.css` the boards load. |
| `design/screenshots/` | PNG of each board (Pass 6 export; boards changed since may differ). |
| `design/strings.json` | Draft Hindi / Marathi interface strings. Needs a native-speaker review. |
| `docs/history/2026-10-09-pass6/` | Pass 6 handoff (HANDOFF, LIVE_SITE_REVIEW, prompt). Snapshot; don't edit. |
| `design/screens/canvas.json` | Board titles, sizes and positions on the original canvas. |
| `design/screens/index.html` | Gallery of every board. |
| `design/screens/support.js` | The runtime that renders `.dc.html` files. Don't edit. |
| `design/screens/assets/` | The 16 stamp and cursor SVGs (added 2026-10-09). Copies for the app live in `assets/stamps/` and `assets/cursors/`. |
| `design/motion/MOTION.md` | **Every animation, with exact delays, durations, easing and reduced-motion fallbacks.** Read it before building any animated screen. |
| `design/motion/filmstrips/` | Frame-by-frame PNGs of each animation (numbered, timestamped). Look at these, since you can't play the animations. |
| `design/README.md` | How the screen files work and how to preview/edit them. |

## Animations

You can't play the animations in the `.dc.html` files, and several run on JS timers. **Don't guess motion from the static markup.** Use `design/motion/MOTION.md` for timings and the matching image in `design/motion/filmstrips/` for what it looks like. If a screen animates and isn't covered there, say so and ask Ashmit; don't invent the motion. To capture new filmstrips, see `design/motion/tools/README.md`.

## Previewing screens

```bash
cd design/screens && python3 -m http.server 8000
# open http://localhost:8000/index.html
```
Opening files straight from disk won't work: screens import each other over HTTP.

## The original canvas

The design also lives at https://claude.ai/artifact/KBgcFxZShLJtR21cxHsr67 (private to Ashmit). This folder is a copy from 2026-10-09. Once Ashmit edits here, **this folder is the newer version.** Ashmit decides whether the canvas or this folder is the main copy going forward; ask if it's unclear.

## The app code

The Expo app (`uneditd-app.zip`: Expo SDK 57, Expo Router, Supabase, routing + landing page) isn't in this folder. If Ashmit adds it, note that it predates passes 4–5 and still uses the old name and fonts.
