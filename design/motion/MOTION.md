# Un:edited — motion spec

Claude Code can't play the animations in the `.dc.html` files. It only sees the code, and some of the motion runs on JS timers. This file has every animation written out with exact timings. `filmstrips/` has frame-by-frame captures you can open as images.

**How to use this when building:**

1. Open the filmstrip PNG for the animation. It shows numbered frames with timestamps.
2. Build it from the table below: exact delays, durations and easing.
3. Check the source lines given in each section if anything is unclear.
4. Every animation needs a **reduced-motion fallback** (last column). In React Native use `useReducedMotion()` from Reanimated, or `AccessibilityInfo.isReduceMotionEnabled()`.

**Translating CSS to React Native (Reanimated 3):**

| CSS in the design | Reanimated |
|---|---|
| `animation: x .6s cubic-bezier(a,b,c,d) 1.6s both` | `withDelay(1600, withTiming(1, { duration: 600, easing: Easing.bezier(a,b,c,d) }))` |
| `ease-out` / `ease-in-out` / `linear` | `Easing.out(Easing.ease)` / `Easing.inOut(Easing.ease)` / `Easing.linear` |
| keyframes with % stops | `withSequence(withTiming(...), withTiming(...))`, each step's duration = (% gap × total) |
| `infinite` | `withRepeat(..., -1, false)` |
| `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` (left-to-right "wipe") | Wrap in a View with `overflow: 'hidden'` and animate its `width` from 0 to the measured text width (or animate a `translateX` mask). |
| `transform-origin: left` + `scaleX` | RN scales from the centre. Either use `transformOrigin` (RN ≥ 0.74) or animate `width` instead. |
| `box-shadow: 0 0 0 2000px scrim` spotlight | Four scrim Views around the hole, or an SVG `<Mask>` with a rect cut-out. |
| `stroke-dashoffset` line drawing | `react-native-svg` + `useAnimatedProps` on `strokeDashoffset`. |

The **landing page is web-only**, so its CSS can be copied as-is into a web-only component (`*.web.tsx` or plain HTML/CSS).

---

## 1. Welcome — wordmark wipe (`OB1Welcome.dc.html`, lines 16–28)
Filmstrip: `filmstrips/01-welcome.png`

| # | Element | Effect | Delay | Duration | Easing | Reduced motion |
|---|---|---|---|---|---|---|
| 1 | Wordmark "Un:edited" (56px) | Wipe in left→right (`clip-path inset(0 100% 0 0)` → `inset(0 -4% 0 0)`) | 0.25s | 1.1s | `cubic-bezier(.65,0,.35,1)` | Shown, no animation |
| 2 | Accent rule under it (224×2px) | `scaleX` 0→1 from the **centre** | 1.25s | 0.7s | `cubic-bezier(.65,0,.35,1)` | Shown |
| 3 | Motto "Every story, as it was written." | Rise: opacity 0→1, `translateY` 10→0 | 1.6s | 0.6s | `cubic-bezier(.2,.7,.2,1)` | Shown |
| 4 | "No AI." line | Rise | 2.3s | 0.6s | same | Shown |
| 5 | "No algorithm." line | Rise | 2.8s | 0.6s | same | Shown |
| 6 | "No fee." line | Rise | 3.3s | 0.6s | same | Shown |
| 7 | Buttons block | Rise | 3.9s | 0.6s | same | Shown |

The whole sequence takes about 4.5s. Buttons aren't tappable until they appear (fill mode `both`).

## 2. Getting your edition ready (`OB8Printing.dc.html`, lines 16–28 CSS, 72–85 JS)
Filmstrip: `filmstrips/02-printing.png`

**Driven by a JS timer, not CSS alone:**
- On mount: after 60ms set progress to 25%. Then **every 1600ms** advance one step (4 steps), progress = (step+1)×25%, capped at 100.
- Steps (each appears as a new row): "Setting the type" → "Gathering your sources" → "Arranging your front page" → "Folding the paper".
- After step 4 (about 6.4s) the heading changes to "Your edition is ready." and the "See my edition" button appears.

| Element | Effect | Timing | Reduced motion |
|---|---|---|---|
| App icon (128px, "Un" cropped) | Fade in | 0.5s ease-out | Shown |
| Heading "Getting your edition ready" | Wipe in | 0.12s delay, 0.7s `cubic-bezier(.4,0,.2,1)` | Shown |
| Its three trailing dots "…" | Each dot loops: hidden 0–15%, visible 35–70%, hidden 90–100% | 1.4s infinite, ease-in-out; dots staggered 0 / 0.2 / 0.4s | Dots shown steady |
| Each new step row | Rise: opacity 0→1, `translateY` 8→0 | 0.4s ease-out | Shown |
| Row label | Wipe in | 0.12s delay, 0.7s | Shown |
| Current row's marker "•" and trailing "…" | Blink, opacity 1→0.25→1 | 1s infinite ease-in-out | Steady |
| Finished row's "✓" (accent colour) | Fade in | 0.5s | Shown |
| Progress bar (2px, accent on rule colour) | `width` transition to each new % | 1.6s **linear** (so it moves continuously) | Jumps |
| "Your edition is ready." | Wipe in | as heading | Shown |
| "See my edition" button | Rise | 0.4s | Shown |

## 3. Sign in — stamp drops onto the edition card (`OB9SignIn.dc.html`, lines 16–22)
Filmstrip: `filmstrips/03-signin-stamp.png`

The **edition preview card** (250px wide; wordmark, "EDITION Nº 1 · TUE 6 OCT" strip, photo block, headline, two grey text lines) is static. The capped Brand stamp (`assets/stamp-brand-paper-capped.svg` / `-ink-capped`, 96×96, positioned at left 276 top 206, overlapping the card's bottom-right corner) stamps onto it:

| Element | Keyframes | Delay | Duration | Easing |
|---|---|---|---|---|
| Stamp | 0%: opacity 0, `translateY(-34px) scale(2.1) rotate(-16deg)` → 55%: opacity 1, `scale(.9) rotate(3deg)` → 70%: `scale(1.06) rotate(-1deg)` → 85%: `scale(.98)` → 100%: none | 0.7s | 0.5s | `cubic-bezier(.5,0,.75,1.4)` (overshoot) |
| Card "thud" | 0/100%: none → 30%: `translateY(2px) rotate(-.4deg)` → 60%: `translateY(-1px)` | 0.98s (when the stamp lands) | 0.28s | ease-out |
| Ink ring (96px circle, 2px accent border, same position) | opacity .55 `scale(.7)` → opacity 0 `scale(1.5)` | 0.98s | 0.5s | ease-out |

Reduced motion: stamp shown in place, no thud, ring hidden.

The same stamp-down is reused at the **end of the tour** (section 5), and a softer version on the **landing hero** (section 9).

## 4. Tour — spotlight, card and swipe hint (`Tour.dc.html`, lines 17–29)
Filmstrips: `filmstrips/06-tour-step-change.png` (step change), `filmstrips/04-tour-swipe-hint.png` (step 5)

| Element | Effect | Timing | Reduced motion |
|---|---|---|---|
| Spotlight box (scrim everywhere except the target, 2px accent outline, 3px offset) | Moves and resizes to the next target: `left/top/width/height` transition | 0.35s `cubic-bezier(.3,.7,.3,1)` | Jumps |
| Hint card | Slides to its new `top` | 0.35s same easing | Jumps |
| Card body text | Fades in: opacity 0→1, `translateY` 8→0, restarts on every step | 0.3s ease-out | Shown |

**Swipe hint (step 5, "Swipe left or right to switch sections"):** a 40px accent-ringed dot over the photo moves left↔right, leaving a 3px accent trail, on a **2.6s infinite** loop:
- Dot (`cubic-bezier(.45,0,.3,1)`): 0% x=−96 opacity 0 → 12% visible → 50% x=+96 → 62% fades out at +96 → 75% visible again → 100% back at −96, opacity 0. In short: it swipes right, then swipes back left.
- Right trail (`transform-origin: left`, ease-out): `scaleX` 0→1 between 10% and 45% (opacity up to .55), gone by 60%.
- Left trail (`transform-origin: right`): grows between 60% and 95%, gone at 100%.
- Reduced motion: dot static in the centre, both trails shown at 50% opacity.

## 5. Tour done — "You're all set" stamp (`Tour.dc.html` step 9)
Filmstrip: `filmstrips/05-tour-done-stamp.png`

Capped Brand stamp, 120×120, centred over the lead photo: 0% opacity 0, `translateY(-30px) scale(2) rotate(-16deg)` → 55% opacity 1, `scale(.9) rotate(3deg)` → 72% `scale(1.05) rotate(-1deg)` → 100% none. **Delay 0.2s, 0.5s, `cubic-bezier(.5,0,.75,1.4)`.** No thud or ring here. Reduced motion: shown in place.

## 6. Feed — "You're all caught up" newspapers (`Feed.dc.html`, lines 16–19; `WebFeed.dc.html` similar)
Filmstrip: `filmstrips/07-feed-caught-up.png`

Three small line-drawn newspaper SVGs peek up from behind the top edge of the caught-up sheet:

| Paper | Size | Left | Final rotation | Delay |
|---|---|---|---|---|
| 1 | 112×96 | 20px | −9° | 0.20s |
| 2 | 124×104 | 130px | 3° | 0.35s |
| 3 | 112×94 | 256px | 9° | 0.50s |

Each goes from opacity 0, `translateY(80px) rotate(0)` to opacity 1, `translateY(0) rotate(final)` over **1.1s, `cubic-bezier(.16,.8,.24,1)`**. They sit with `bottom: calc(100% − 24px)`, so they tuck 24px behind the sheet. Reduced motion: shown at their final rotation.
On **web**: the papers are 160/180/156px wide at left 2% / 32% / 62%, 1.2s, rise 90px. Where supported (`animation-timeline: view()`) they're tied to scroll position instead of time.

## 7. Sign out sheet (`SignOut.dc.html`)
Filmstrip: `filmstrips/08-signout-sheet.png`

Scrim fades in over 0.2s ease-out. The sheet slides up from `translateY(100%)` over 0.32s `cubic-bezier(.2,.8,.2,1)`. Reduced motion: both appear instantly. **Use the same motion for every bottom sheet** (⋯ menu, Save to, caught up) unless you decide otherwise.

## 8. Loading skeleton (`Skeleton.dc.html`, `Components.dc.html`)
Filmstrip: `filmstrips/09-skeleton-pulse.png`

The whole skeleton block pulses its opacity 1 → 0.55 → 1, **1.8s infinite ease-in-out** (1.6s on the Components board). There's no shimmer sweep, only the pulse. Reduced motion: static.

## 9. Landing page (`Landing.dc.html`, web only; CSS lines 16–95, JS ~430–500)
Filmstrip: `filmstrips/10-landing-hero.png` (1440×900, first 9s)

**Hero, on load:**

| Element | Effect | Delay | Duration / easing |
|---|---|---|---|
| "Every story," | Wipe in (`clip-path`) | 0.15s | 1.1s `cubic-bezier(.65,0,.35,1)` |
| "Un:" + typed word | Rise (opacity, `translateY` 24→0) | 0.55s | 0.8s `cubic-bezier(.2,.7,.2,1)` |
| Paragraph | Rise | 0.9s | same |
| Buttons | Rise | 1.2s | same |
| Phone mockup column | Rise | 0.9s | same |
| 6 line-drawn paper sheets behind the phone | "Unfold": from centre, `scale(.55) rotate(0)` opacity 0 → their offset/rotation (see `--x --y --r` on lines 142–157), then the lines draw in (`stroke-dashoffset` 1→0) | 0.5 / 0.65 / 0.8 / 0.95 / 1.1 / 1.2s (lines start +0.3s) | unfold 1.6s `cubic-bezier(.16,.8,.24,1)`; draw 1.8s `cubic-bezier(.45,0,.25,1)` |
| Brand stamp (156px, top-right of phone) | 0% opacity 0 `scale(1.35) rotate(-6deg)` → 60% `scale(.97)` → 100% none | 1.9s | 0.45s `cubic-bezier(.3,.7,.3,1)` |

**Typing headline (JS):** "Un:" + a word typed one letter at a time. Words cycle **changed → biased → masked → edited**. It starts 1.4s after load, types at 150ms per letter, holds 2.6s, erases at 70ms per letter, pauses 0.6s, then types the next word. It stops on **"edited"** (giving "Un:edited"). After 2.4s the caret fades out (0.8s). The caret is a thin bar blinking at 1.05s with `steps(1)`. Reduced motion: shows "Un:edited" immediately, no caret blink.

**Phone demo (JS):** the phone mockup loops through 5 app screens, each auto-scrolling (`--to` offset, ease `cubic-bezier(.45,0,.25,1)`, holds 14% at the start and end):

| Screen | Duration | Scroll | Tap ripple before leaving |
|---|---|---|---|
| Home | 6.4s | −1040px | at (241, 800), Library tab |
| Library | 4.2s | 0 | (332, 800), You tab |
| You | 5.6s | −540px | (149, 800), Feed tab |
| Feed | 4.2s | 0 | (195, 330), opens story |
| Article | 6.4s | −780px | (38, 36), Back |

Screens cross-fade in over 0.45s. The tap ripple (56px accent ring) shows 650ms before each switch: `scale(.35)` opacity .9 → `scale(1.5)` opacity 0, 0.65s ease-out. The active tab is accent coloured.

**Other landing motion:**
- **Parallax on scroll** (only where `animation-timeline: scroll()` is supported), over the first screen height: text drifts down 90px and fades to .35, phone moves up 70px, paper sheets move down 160px and scale to 1.06.
- **Section reveal:** each numbered section (01–06) starts hidden (opacity 0, `translateY(44px)`) and transitions in over 1s `cubic-bezier(.2,.7,.2,1)` when its top passes 88% of the viewport height (JS scroll check).
- **"04 Your day" newspapers:** same peek as section 6, triggered by that section's reveal (1.2s, 0.15 / 0.3 / 0.45s stagger).
- **Outlet marquee:** a row of outlet names scrolls left forever, one loop every 60s linear, pausing on hover. Each name is accent coloured and underlined on hover (0.2s).
- **Source versions (section 01):** the four outlets' versions of the same story auto-rotate every 6s, cross-fading over 1.4s `cubic-bezier(.25,.6,.3,1)`. Clicking a tab stops the auto-rotate.
- **Buttons:** hover lifts 2px (0.2s). Ghost buttons get an 8% tint.
- **Phone mockup float** (`lp-float`: `translateY` 0 → −10px → 0, 6s ease-in-out infinite, after 2s) is defined in the CSS but **not used** on any element. Leave it out unless Ashmit wants it.
- Reduced motion turns all of the above off and shows everything in place.

## 10. Web cursors (desktop only; WebHome/WebFeed/WebArticle/WebLibrary/WebSearch/WebYou/Landing)
Not an animation, but easy to miss: with `(hover: hover) and (pointer: fine)` only:
- Everywhere: `cursor: url(assets/cursor-pointer-paper.svg) 4 3, default` (use `-ink` in dark mode).
- Links that open a story: `url(assets/cursor-readmore-paper.svg) 32 32, pointer` (the Read more stamp).
- Other links and buttons: normal `pointer`. Inputs: `text`.

## 11. Not animated (by design)
Tab switches, Feed category tabs, Save toggle, the Article prev/next source switch and Accessibility settings have no designed motion. Use the platform defaults or ask Ashmit.

---

### Seeing the motion live
- **In a browser:** `cd design/screens && python3 -m http.server 8000`, then open e.g. `http://localhost:8000/OB1Welcome.dc.html`. Reload to replay. The Tour advances with Next. Other steps: `TourDark.dc.html` is step 5.
- **Capture new filmstrips** (e.g. after changing a design): `tools/capture.js` + `tools/strip.py`. See `tools/README.md`.

## 12. Light / dark switch (web; added 2026-10-09, no design board)

Asked for by Ashmit: switching Paper ↔ Ink should fade, not jump.

- **Where:** the theme toggle in the web top nav and landing header, and You › Reading › Theme.
- **Motion:** whole-page cross-fade, **600ms, ease-in-out**, via the View Transitions API (`::view-transition-old/new(root)`). Browsers without it get the same 600ms on `background-color`, `color`, `border-color`, `fill` and `stroke` (class `theme-fade` on `<html>`).
- **Reduced motion:** instant (system setting or You › Reduce motion).
- **Code:** `src/theme/fade-theme.web.ts`, CSS in `src/app/+html.tsx`. The Android app switches instantly.

## 13. Web onboarding (`WebOnboarding.dc.html`, helmet CSS; added to this file 2026-10-09)

Taken from the board's own CSS (it wasn't covered here before):
- **Step change:** each step's content fades in and rises 10px, **0.35s ease-out** (`wo-in`).
- **Progress bar** under the header: width eases to the new step over **0.35s**.
- **Printing bar** ("Your edition is ready."): fills 0 → 100% over **2.4s ease-in-out** (`wo-bar`).
- Reduced motion: all three are static.
- Code: `src/components/wide/onboarding.tsx`.

## 14. Tour as built (`src/tour/tour.tsx`)

Follows §4–5. The spotlight is drawn as four scrim panels around the target plus a 2px accent ring 3px out, all animated together over 0.35s `cubic-bezier(.3,.7,.3,1)`; the card's `top` uses the same timing. Targets are the real screens' views, measured after the screen lays out.
