---
target: Trend web app (trend/src/App.jsx)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-07-28T08-23-25Z
slug: trend-src-app-jsx
---
Method: dual-agent (A: a2c61270def5f65b6 · B: a61a1fae60416e213)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `Save entry` in Daily Log gives zero confirmation; `Toast` only wired into Meals and has no `aria-live` |
| 2 | Match Between System and Real World | 3 | Copy is domain-native and excellent; 7 nav glyphs are arbitrary abstract symbols, and "Trends" collides visually with the app name "TREND" |
| 3 | User Control and Freedom | 2 | No undo anywhere; a habit `✕` deletes the habit *and its whole week of ticks* in one tap while weigh-ins/recipes correctly use two-tap confirm |
| 4 | Consistency and Standards | 2 | `ConfirmBtn` applied to only ~half of deletes; hand-rolled chips hardcode `#fff` instead of the `--on-accent` token; Me is the only tab with no two-column desktop layout |
| 5 | Error Prevention | 2 | Trends' goal input persists on every keystroke; Daily Log's Save silently no-ops on blank weight, looking like a dead button |
| 6 | Recognition Rather Than Recall | 2 | GLP-1's rating scales render ten identical blank circles — only the *selected* one shows its number, so rating "7" means counting |
| 7 | Flexibility and Efficiency of Use | 2 | No swipe/shortcuts/search across 30 recipes; the shopping list sits ~2 screens down a ~3,700px Meals tab |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained and coherent, but Meals/Trends/Me each run 3,400–3,900px with no in-page anchors; Today surfaced 10 milestones in one banner |
| 9 | Help Recognize/Diagnose/Recover from Errors | 1 | Two raw browser `alert()` calls remain (storage full, bad backup file); nothing deleted is ever recoverable |
| 10 | Help and Documentation | 3 | Excellent inline microcopy throughout; no onboarding tour, no glyph legend for the nav icons |
| **Total** | | **23/40** | **Acceptable — significant improvements needed before users are happy** |

## Design Specificity Verdict

**LLM assessment (Assessment A):** Strongly product-specific in its content layer — one of the more genuinely grounded personal trackers reviewed. The Today screen names the actual day and next action ("Tuesday — Swim · 0/12 · ← next"), the scoreboard hero argues for the 7-day average over today's raw number as its literal thesis, the schedule references real batch-cook logistics, and the GLP-1 module's food-noise scale and injection-site rotation grid could not be lifted into another product unchanged. The exception is the chrome: the ceramic/neumorphic card-and-pill-nav shell with abstract glyph icons (☀ ✎ ▤ ◍ ◧ ✚ ◉) is a portable, category-generic visual language — the specificity lives entirely in the content and defaults, not the surface.

**Deterministic scan (Assessment B):** CLI scan on `trend/src/App.jsx` returned exit code 2 with 2 findings (a hardcoded 4px `borderLeft` "side-tab" accent at line 678, and a layout-thrashing `transition: width` at line 657). Live browser injection across all 6 reachable tabs (Today, Daily Log, Schedule, Meals, Trends, Me — GLP-1 wasn't in this pass's rotation) surfaced 9–41 findings per tab, dominated by: undersized bottom-nav labels (8.5px, every tab), a colored dark-mode box-shadow glow present on `body` (every tab), inconsistent primary-font resolution (Roboto/Arial reported instead of the intended font stack, 30–78% depending on tab — plausibly a headless-browser font-availability artifact rather than a real-device bug, worth a manual check on an actual phone), and concentrated low-contrast findings on Meals (30×, though likely inflated — see below) and Me (11×, real).

**Where they agree:** Both independently flagged contrast failures on the same class of elements — muted secondary text and accent-filled chips — with Assessment B supplying exact ratios (2.66–4.3:1 depending on element, all short of the 4.5:1 text minimum) for what Assessment A identified by name (`--faint`, `PINE_T`, hardcoded `#fff` on accent). Both also flagged Meals as the most overloaded screen — A on cognitive-load grounds (four unrelated jobs in one scroll), B by raw defect density (41 findings, more than any other tab).

**Where the detector caught what the LLM missed:** The Trends tab's summary card renders text at 1.9:1 contrast (`#171310` on `#2f4a3e`) — a near-invisible combination Assessment A didn't call out specifically. It also caught a Recharts axis-label overflowing its container by 19px on Trends, and the `transition: width`/hardcoded-border code smells at exact line numbers.

**Likely false positive:** 30 of Meals' findings are `1.0:1 — text #000000 on #000000` on repeating selectors matching the recipe/rotation chip list. Assessment B flagged this itself as probably a decorative/icon div with no visible text rather than 30 real invisible-text bugs — worth a 30-second manual check before treating as real, but not dismissed outright.

**One real tension between the two assessments, unresolved:** Assessment A identified a concrete code bug — the app's default `colorTheme` state is `"pine"`, which doesn't exist in `COLOR_THEMES` (the real ids are forest/navy/plum/amber/burgundy/teal/rose/olive), so on a fresh install in dark mode none of the eight `.tt-dark.tt-theme-{id}` shadow rules match and every card should render with zero depth. Assessment B's detector, in a separate session, *did* find a colored `dark-glow` box-shadow present on `body` in dark mode. These don't obviously reconcile — possibly the two sessions ended up in different theme states, or the glow is coming from somewhere other than the per-theme card rule. Worth a two-minute manual check (open the app fresh, no localStorage, force dark mode) before shipping a fix for either claim.

**Visual overlay note:** Assessment B used the detector's exposed `window.impeccableDetect()` API directly for structured per-tab results rather than leaving a live overlay open, and closed its browser session and the `live-server.mjs` process before returning. There is no `[Human]`-labeled tab left open with a visible overlay to point you to — all findings above are from the structured scan output.

## Overall Impression

Trend's content and defaults are unusually well-authored for a personal tool — the copy, the 7-day-average thesis, and the progressive-disclosure architecture (GLP-1 off by default, tabs individually hideable, the rotation picker collapsed behind "Edit rotation") are real design decisions, not template filler. But the app is currently unusable with a screen reader (zero landmarks, zero ARIA labels, no focus styles), inconsistently protects against data loss (recipes and weigh-ins get a confirm step; habits, workouts, schedule items, and photos don't), and asks a lot of a "quick action, several times a day" tool: Meals alone is a ~3,700px scroll doing four different jobs. The single biggest opportunity is closing the gap between the app's evident care in its content and its current disregard for the people who can't see, tap precisely, or afford to lose a week of data to a mis-tap.

## What's Working

1. **The 7-day-average-first scoreboard is an argued design decision, not a layout default.** Making the `avg7` figure 76px and demoting the actual latest weigh-in to 14px body text encodes the app's whole thesis directly in the type scale — most trackers do the opposite and then apologize for the noisy daily number in a tooltip.
2. **The below-BMR guard rail is real error prevention, not a warning label.** Typing a custom calorie target under BMR surfaces a warm-amber panel that explains *why* it's harmful, offers the specific safer number, and points at a GP — educating instead of just blocking, at exactly the moment a user is most likely to hurt themselves.
3. **Progressive disclosure is structural.** GLP-1 defaults off and keeps its data if re-enabled; four tabs are individually hideable; the Meals rotation picker was deliberately collapsed after the last usability pass specifically to stop 30 chips from preceding the macro check. The app is shaped to shrink to the user, not to show off feature count.

## Priority Issues

**[P1] Destructive actions bypass the app's own confirm pattern.**
*Why it matters:* Habit removal, workout deletes, schedule-item removal, shopping-item removal, and food-log removal all fire instantly with no confirmation and no undo — while weigh-ins, recipes, and supplements correctly require a two-tap `ConfirmBtn`. Removing a habit also silently drops that habit's *entire week of ticks*. This is a thumb-driven, no-cloud-backup app; a mis-tap permanently destroys real streak/history data.
*Fix:* Route every delete through the existing `ConfirmBtn` component (it's already in the codebase and used correctly elsewhere) rather than a bare `✕` button. For habits specifically, name what's being lost in the confirm label (e.g. "Delete this habit and this week's ticks?").
*Suggested command:* `/impeccable harden`

**[P1] Accessibility is effectively absent, and it correlates with the app's own contrast failures.**
*Why it matters:* Zero headings, zero landmarks, and zero ARIA labels exist anywhere in the app — the entire interface is one flat run of unlabeled generic nodes to a screen reader. 53 of 81 buttons on the GLP-1 tab and 31 of 33 form controls on Me have no accessible name. There are no author-defined focus-ring styles anywhere in the CSS. This is compounded by measured contrast failures on the exact elements doing wayfinding: nav labels (2.66:1), the "next" highlight and "Full week →" links (2.71:1), card headings (3.52:1), active accent-filled chips (2.75:1), and — newly confirmed by the detector — Trends' summary card text at 1.9:1 and several Me controls at 3.5–4.3:1. None clear the 4.5:1 text minimum.
*Fix:* Add semantic structure (`<h1>`/`<h2>` per card, `<nav>` with `aria-current` on the tab bar, `role="switch"`/`aria-checked` on `Toggle`, `role="status"` on `Toast`), `aria-label` on every icon-only button, and author real `:focus-visible` styles. Separately, darken `--faint` and swap hardcoded `#fff` on accent-filled chips for the existing `--on-accent` token (the shared `Btn` component already gets this right — only the hand-rolled chips don't).
*Suggested command:* `/impeccable audit`

**[P1] A default-value bug may be silently flattening the entire dark-mode depth layer on fresh installs.**
*Why it matters:* The app's default `colorTheme` state is the string `"pine"`, which doesn't exist in `COLOR_THEMES` (real ids: forest/navy/plum/amber/burgundy/teal/rose/olive). If confirmed, a brand-new dark-mode user gets a flat, shadowless shell with no card separation until they happen to visit Me and tap a theme swatch — the bug is invisible in code review because the *color* variables correctly fall back to forest, only the *shadow* CSS class fails to match. One of the two assessments found evidence for this; the other found a glow present in a separate session, so this needs a two-minute manual confirmation (fresh install, no localStorage, forced dark mode) before treating as confirmed — but it's cheap to fix either way.
*Fix:* Change the default `colorTheme` state and the `sGet("colorTheme", ...)` fallback from `"pine"` to `"forest"` in all five `App.jsx` copies once confirmed.
*Suggested command:* `/impeccable audit`

**[P2] GLP-1's rating scales are unreadable — ten identical blank circles.**
*Why it matters:* `TapScale` only renders a number on the currently-selected circle; all others show nothing. Rating food noise or mood means counting circles left-to-right every single day, on the tab whose entire purpose is producing a reliable record for a prescriber. Circles also measure 38×38px, under the 44px touch-target floor.
*Fix:* Always render each circle's number (dim when unselected, bright when selected), use `--on-accent` for the selected fill's text, and raise the circle size to 44px — or consider whether a 10-point scale is even the right resolution for daily self-report versus a simpler 1–5.
*Suggested command:* `/impeccable clarify`

**[P2] Information architecture overload, concentrated on Meals.**
*Why it matters:* Today stacks up to seven competing cards and duplicates data three other tabs already own (habits, water, and weigh-in status all appear twice in the app). Meals does four unrelated jobs — macro planning, shopping, food logging, recipe browsing — in one ~3,700px scroll with no in-page anchors, and it's also the single most defect-dense screen by raw detector count (41 findings, versus 7–9 on Today/Daily Log/Schedule). Two visually identical Protein/Carbs/Fat bar triplets sit about one screen apart meaning different things (planned rotation average vs. actual logged-today total) against the same targets, which is a real working-memory trap.
*Fix:* Give Meals in-page section anchors or split food-logging from recipe browsing; consider whether Today needs to re-surface data that Habits/Schedule/Daily Log already own, or whether it should stay a pure action hub.
*Suggested command:* `/impeccable layout`

## Persona Red Flags

**Alex (impatient power user)**
- Correcting a typo'd weigh-in is punitive: the Today weigh-in card disappears once logged, so a fix means navigating to Daily Log, re-entering *all six* fields, and trusting a footnote that re-saving a date silently overwrites it — there's no edit affordance, only Delete.
- The shopping list — the most-used artifact in a batch-cook workflow — sits roughly 1,400px down the Meals tab behind the rotation card, with no anchor, jump link, or search across the 30 recipes above it.
- Daily Log's Save button silently no-ops on a blank weight field with zero feedback — reads as a broken button, not a validation rule.

**Sam (accessibility-dependent, screen reader/keyboard-only)**
- Blocking: zero headings and zero landmarks app-wide — no way to navigate by structure at all.
- Blocking: the 8 water-cup buttons on Today and the 7 `Toggle`s in Me announce as unnamed, valueless buttons; toggle on/off state is conveyed by color and thumb position only, with no `role="switch"`.
- Blocking: 31 of 33 controls on Me (including the `DobPicker`'s three selects) have no accessible name.
- Zero author-defined focus styles exist anywhere; the theme swatch is the only element with an intentional outline.

**Casey (distracted, thumb-only, frequently interrupted)**
- The habit `✕` sits 8px from the tick-count label directly above a row of 7 tick circles — a mis-tap while scrolling one-handed destroys a week of streak data with zero undo.
- Today's schedule rows are 42px tall (under the 44px floor) and span the full card width, so a stray thumb-scroll toggles an item done with only a strikethrough as feedback.
- The Today weigh-in card vanishes entirely after the first save, and the 46-day streak — the single most motivating number in the app — sits below a 12-row schedule list rather than above the fold.

## Minor Observations

- Build is clean; no console errors on any tab in either assessment.
- Two raw browser `alert()` dialogs remain (storage-full, bad-backup-file) — the only native modal pattern in an otherwise toast-based app.
- `computeMilestones` generates one milestone per kg lost (loop to 60), which produced a 10-item "Milestones unlocked" banner on Today for a realistic 6kg loss — worth capping the banner at ~3 with "…and N more."
- The goal weight is independently editable in two places (Trends hero, Me → My details) with different affordances and no cross-reference.
- `Toast` hardcodes its colors (`#221D18`/`#F2ECE0`) rather than using theme tokens — the one component that ignores the color-theme system, and it has no `aria-live`.
- Detector flagged `em-dash-overuse` (10–11 per page) on Meals/Trends/Me — a copy-style signal, not a rendering defect; worth knowing but not a priority fix.
- Detector flagged a `transition: width` (Trends' progress bar) as a layout-thrashing animation — cheap fix is animating `transform: scaleX` instead.
- Detector's `overused-font` (Roboto/Arial reported as primary instead of the intended font stack) may be a headless-browser font-availability artifact rather than a real-device bug — worth a quick check on an actual phone/desktop browser before treating as real.
- `CLAUDE.md` is now out of date in a few places: §1 still describes a standalone Habits tab (merged into Schedule since), §4 documents 3 color themes (8 now exist), and §5's storage-key list is missing `foodLog` and `rotation`.

## Questions to Consider

1. **What if Today were the only tab that mattered, and everything else were a drill-down?** The app currently spends its structure budget on seven peers, then re-surfaces the same data on Today anyway (habits, water, and weigh-in status all appear twice). What would the shell look like if Today owned all daily actions and the others became weekly-intent destinations rather than tabs to thumb past?
2. **What if the app refused to show a number it hasn't earned?** It already argues the 7-day average is the only number worth a vote — but still renders a raw BMI, a raw daily weight, a body-fat percentage it admits is noisy, and a goal-progress bar, all on one screen. If the thesis is real, which of those survives?
3. **What if the neumorphic shell were deleted entirely?** The product's identity is carried by its copy, defaults, and its 7-day-average argument — none of which need soft shadows. The shadow layer costs real per-theme CSS maintenance across five files and may be doing the visual job that a proper focus ring should be doing instead. Would anyone using this daily actually miss the bevels?
