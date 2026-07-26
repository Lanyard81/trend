# CLAUDE.md — Trend Project Handover

This is a handover for Claude Code (or any engineer) picking up **Trend**, a personal health-tracking app built as a single React codebase deployed across five targets. Read this before making changes — several of the constraints here were learned the hard way through live bugs, and violating them will reintroduce those bugs silently.

---

## 1. What Trend is

A daily-use health tracker: weight/measurements, habits, a weekly schedule, 30 recipes with macro tracking, a persistent shopping list, an optional GLP-1 medication module, photo check-ins, and full backup/export. Single-user, fully offline, no backend, no auth, no analytics. All data lives on-device.

Seven tabs: **Today, Trends, Daily Log, Habits, Schedule, Meals, GLP-1** (optional, off by default), plus a permanent **Me** tab for settings. Today and Me can never be hidden; the other five are individually toggleable in Me → Tabs & features.

---

## 2. The five-platform architecture

**One React source file (`App.jsx`), copied five times, differing only in the storage adapter.** There is no shared package/monorepo tooling — keeping them in sync is a manual/scripted discipline, not an automated one. This is a deliberate simplicity trade-off; do not "fix" it by introducing a monorepo without discussing it first, as it changes the whole workflow described below.

| Target | Location pattern | Storage adapter | Ships as |
|---|---|---|---|
| Claude artifact | `health-tracker.jsx` (single file, default export) | `window.storage` (async get/set/delete/list, artifact-provided) | Published Claude artifact link |
| Web / PWA | `tt/src/App.jsx` (Vite + React project) | `localStorage`, keys prefixed `tt:` | Deployed via GitHub Pages (static `dist/` build) — see §7 |
| Desktop | `tt-desktop/src/App.jsx` (same Vite project + Electron wrapper) | `localStorage` in the Electron renderer | `.exe`/`.dmg` via `electron-builder` (NSIS installer + portable) |
| iOS | `tt-ios/src/App.jsx` (same Vite project + Capacitor) | `@capacitor/preferences` | Xcode → App Store or ad-hoc install |
| Android | `tt-android/src/App.jsx` (same Vite project + Capacitor) | `@capacitor/preferences` | Android Studio → APK/App Bundle |

**Storage is abstracted behind two functions**, `sGet(key, fallback)` and `sSet(key, value)`, defined once near the top of `App.jsx` per platform, switching on the adapter. All app logic calls these two functions only — never the underlying platform API directly. If you add a new persisted field, add it through `sGet`/`sSet`, not a direct `localStorage.setItem` etc.

### The golden rule of this codebase
**Any functional or visual change must be applied identically to all five `App.jsx` copies in the same pass.** They are expected to be byte-identical except for the storage-adapter block near the top and platform-specific config files (`capacitor.config.json`, `electron.cjs`, `vite.config.js`, `index.html`, `manifest.webmanifest`). If you find the five files have drifted, that's a bug in itself — diff them before doing anything else.

**Recommended workflow for any change**: write one Python (or similar) script with exact `old_str` → `new_str` replacements guarded by `assert old_str in content`, then run it against all five files in one invocation. Never hand-edit one copy and forget the other four. This repo's history was built almost entirely this way — see the pattern in past commits/patches if any are retained.

---

## 3. Critical rendering constraint — read this before touching any style

**The Claude artifact renderer silently drops CSS custom properties (`var(--x)`) when they appear inside:**
- `border` / `borderLeft` / etc. **shorthand** strings (e.g. `border: "1px solid var(--line)"`)
- SVG attributes (`stroke=`, `fill=`)
- Recharts stroke/fill props

This is **not** a bug in normal browsers — it only affects the artifact's JSX inline-style renderer. But because the artifact is one of the five ship targets, **the whole codebase treats this as a hard constraint everywhere**, not just in the artifact file, so all five stay identical.

**The fix pattern, used throughout:**
- Never write `border: "1px solid var(--line)"` (shorthand + var). 
- Either use **longhand properties with a literal hex/rgba value** — `borderWidth: 1, borderStyle: "solid", borderColor: "#E8E0D2"` — or keep the var() reference but move it into a real `<style>` block / CSS class (plain `<style>{CSS_STRING}</style>` tags are safe; it's specifically the React inline-style-object parsing that's affected).
- Chart stroke/fill colors (Recharts `<Line stroke={...}>` etc.) must be **plain JS string literals computed from the current theme**, never a `"var(--x)"` string.

Before landing any style change, grep the diff for `solid var(--`, `dashed var(--`, and any `${SOME_VAR}` template-literal interpolation inside a `border:`/`stroke=`/`fill=` context. This exact class of bug has recurred multiple times across this project's history (invisible water-cup borders, invisible chart gridlines in light mode) — it is the single most common regression in this codebase.

---

## 4. Design system (current state)

The visual system has been through several deliberate iterations; **the current one is "ceramic base + neumorphic/glass accent layer,"** applied on top of a token system. Do not assume any style described in older comments/docs is still current — check the live token definitions below.

### Token architecture
Defined once near the top of each `App.jsx`:
- `NEUTRAL_VARS` — `{ light: {...}, dark: {...} }`, each a flat object of CSS custom property names → hex values (`--bg`, `--surface`, `--surface2`, `--ink`, `--mut`, `--faint`, `--line`, `--line2`, `--bord`, `--amber`, `--good`, `--warn-bg`, `--warn-t`, `--gold`). Dark mode background is literal **true black `#000000`**, not grey — preserve this if asked to touch dark mode again.
- `COLOR_THEMES` — array of three selectable themes: **Forest & Mustard, Navy & Terracotta, Plum & Copper**. Each entry: `{ id, name, primary, ptD (dark-mode-safe primary text), accL/accD (accent light/dark), onAL/onAD (text color that contrasts with the accent, light/dark) }`.
- `themeVars(colorTheme, dark)` — merges `NEUTRAL_VARS[mode]` with the selected theme's primary/accent, returning the full CSS custom property object applied to the root `<div style={{...themeVars(...)}}>`.
- The selected theme id also gets its own class on the root: `tt-theme-forest` / `tt-theme-navy` / `tt-theme-plum`, alongside `tt-dark`/`tt-light`. This is how the neumorphic shadow CSS (below) targets theme+mode combinations without needing JS-computed literals.

### Shared components — do not reinvent, reuse these
- **`Card`** — the standard container. `className="tt-card"`, 18px radius, 18px padding, no inline shadow (shadow comes from the `.tt-card` CSS rule).
- **`Btn`** — `kind` prop: `primary` | `teal` (accent CTA) | `ghost` (secondary, neutral hairline border) | `danger`. Pill-shaped (999px radius). Gets `className="tt-btn tt-btn-{kind}"` for the CSS-driven shadow/hover/press states. **Every button explicitly sets text color** (wrapped in an inner `<span style={{color:"inherit"}}>`) rather than relying on UA inheritance.
- **`ConfirmBtn`** — two-tap destructive-action pattern. First tap arms it (button turns red, label becomes "Confirm delete?"), second tap within 3s fires `onConfirm`. Auto-disarms after timeout. Use this for any new delete affordance rather than an instant single-tap delete.
- **`Toast`** — bottom pill notification, app-level state (`toastMsg` + `showToast(msg)` in `App()`), auto-dismisses after ~2.2s. Rendered once near the root, above the tab bar.
- **`Toggle`** — pill switch, `className="tt-toggle-track"` on the button, `tt-toggle-thumb"` on the inner circle span, for the recessed-groove/raised-thumb CSS treatment.

### The neumorphic/glass shadow layer
Defined as **plain CSS rules inside the existing `RESPONSIVE_CSS` template literal** (rendered via `<style>{RESPONSIVE_CSS}</style>`), scoped by `.tt-light`/`.tt-dark` combined with `.tt-theme-{id}`. This is intentional — it's the safe way to apply theme-and-mode-dependent visual treatment without violating §3, since it's static CSS text, not an interpolated inline style. Light mode gets classic dual-shadow neumorphism (light highlight + warm-dark shadow); dark mode falls back to a translucent glass/blur treatment with a theme-tinted glow, because dual-shadow neumorphism does not read against true black. Buttons invert to an **inset** shadow on `:active` for tactile press feedback. **Card/data content itself stays on flat, unshadowed surfaces — only structural chrome (cards' edges, buttons, nav, toggles) carries the soft-depth treatment.** If asked to touch this again, preserve that flat-content rule; it's there for legibility during daily use, not decoration.

### Bottom navigation
Floating pill-shaped bar (`.tt-tabs`, `border-radius: 999px`), centered, with per-tab circular icon badges. Active tab badge uses `var(--teal-soft)` background (theme accent, low alpha) — not a per-section rainbow (an earlier "true-black" design iteration used 8 different saturated hues per tab; this was deliberately retired in favor of one restrained accent per the current design brief).

---

## 5. Storage keys reference

All persisted under these keys (via `sGet`/`sSet`): `entries`, `habits`, `recipes`, `recipesVersion`, `goal`, `profile` (includes `macroOverride`, `lunchMacros`, `glpEnabled`), `photoIndex`, `photo:{id}`, `supplements`, `week`, `water`, `workouts`, `theme`, `colorTheme`, `seenMilestones`, `schedDone`, `glp`, `glpSettings`, `shopping`, `tabsEnabled`, `holidays`, `rotation`.

If you add a new field, namespace it as its own top-level key (or nest inside `profile` if it's a single-value setting) and **add it to the backup export/import path** (Me → Data & backup) and the CSV export builder — both currently enumerate keys/fields explicitly rather than being fully generic, so new fields are silently excluded from backups unless added there too.

---

## 6. Known gotchas (learned live — don't reintroduce)

- **Habits used to silently reset to defaults every Monday.** Fixed: new weeks now carry forward the most recent prior week's custom habit *list* (not just checkmarks). If refactoring habit storage, preserve this carry-forward.
- **The goal defaults to 0/unset**, not a placeholder number — a new user should never inherit a stranger's goal weight. The UI shows "Set a goal in Me" until one exists.
- **Macro targets are derived, not hardcoded** — `calcMacros(profile, entries)` computes protein from latest logged bodyweight (2g/kg), fat from 27% of the live calorie target, carbs as the remainder. Manual override fields exist in `profile.macroOverride`. Do not reintroduce hardcoded macro constants as the primary source of truth.
- **iOS/PWA home-screen launches read `manifest.webmanifest`'s `start_url`.** It must be relative (`"./"`), not absolute (`"/"`) — an absolute value 404s when the app is hosted at a GitHub Pages subpath (`user.github.io/trend/`). Same for `scope`. This broke the home-screen icon (worked fine in-browser, 404'd only from the icon) and was non-obvious to diagnose.
- **`viewport-fit=cover` + `apple-mobile-web-app-status-bar-style: black-translucent`** (already set in `index.html`) means iOS does **not** reserve status-bar space automatically — top padding must include `env(safe-area-inset-top)` or the header sits under the notch/Dynamic Island/clock. Bottom nav already accounts for `env(safe-area-inset-bottom)`; keep both in sync if touching the shell padding.
- **Electron code-signing**: `signAndEditExecutable: false` is set deliberately in `package.json`'s `build.win` block. Without it, `electron-builder` tries to download a Windows code-signing tool and fails with a symlink privilege error on most Windows setups. Don't remove this to "fix" that error — removing it reintroduces the error.
- **GitHub Pages builds must use `vite.config.js`'s `base: "./"`** (relative), not the default absolute root — otherwise all built asset paths break under a repo subpath.

---

## 7. Build & deploy quick reference

- **Artifact**: `health-tracker.jsx` is pasted/loaded as-is into the Claude artifact system; no build step.
- **Web (GitHub Pages)**: `cd tt && npm install && npm run build` → upload the contents of `dist/` (not the folder itself) to a public GitHub repo → Settings → Pages → Deploy from branch → `main` / root. `vite.config.js` must have `base: "./"`.
- **Web (Vercel alternative)**: import the repo (source, not `dist/`) directly into Vercel; it auto-detects Vite. No `base` path concerns since Vercel serves from root.
- **Desktop**: `cd tt-desktop && npm install && npm run dist` → outputs `Trend-Setup-{version}.exe` (NSIS installer) and `Trend-Portable.exe` in `release/`.
- **iOS**: requires a Mac. `cd tt-ios && npm install && npm run build && npx cap add ios && npx cap sync ios && npx cap open ios` → build/run from Xcode. Free Apple ID = 7-day install expiry.
- **Android**: builds on Windows/Mac/Linux. `cd tt-android && npm install && npm run build && npx cap add android && npx cap sync android && npx cap open android` → build/run from Android Studio.

---

## 8. Testing convention

There is no formal test suite. The pattern used throughout development: after any change, bundle with `esbuild` (`--bundle --format=cjs --external:react --external:react-dom --external:recharts`) and render it in `jsdom` via a small Node script that mounts `<App/>`, waits a tick, and asserts on `document.body.innerHTML` (e.g. "does the welcome banner appear for a fresh user," "are there zero `solid var(--` strings in the rendered output"). This has repeatedly caught regressions (duplicate banners, missing safe-area classes, leaked CSS variables) before shipping. Prefer this over trusting a clean `vite build` alone — a successful build does not mean the component tree renders or behaves correctly.

---

## 9. What NOT to do

- Don't add a bundler/monorepo abstraction to "deduplicate" the five `App.jsx` copies without discussing it — the manual-sync-via-script workflow is intentional given the project's scale.
- Don't reintroduce `var(--x)` inside any border shorthand, SVG attribute, or chart stroke/fill — see §3.
- Don't add food-calorie logging, social features, or notifications — these were explicitly declined by the product owner as scope creep for a low-friction daily tool.
- Don't restyle without being told which direction — this app has deliberately moved through several full visual systems (a "true-black flat/saturated" system, then a "warm ceramic" token system, now a "ceramic + neumorphic/glass accent" layer). Check current token values before assuming any prior written brief still describes the live app.
- Don't silently drop the two-tap/typed-confirmation pattern on destructive actions (Erase All requires typing `RESET`; other deletes use `ConfirmBtn`'s two-tap). This was a deliberate safety decision for a self-hosted personal-data app with no undo/cloud backup.

---

## 10. Where to find more context

Supplementary docs produced during development (may exist alongside this file or in the project's docs folder): `publishing-guide.md` (keystroke-level deploy instructions per platform), `trend-user-guide.md` / `Trend-User-Guide.pdf` (end-user documentation with mockups), `reminders-shortcut-setup.md` (iOS Shortcuts integration for the shopping list → Reminders), `design-brief-warm-ceramic.md` and `design-brief-neumorphic-accent.md` (the design briefs behind the current visual system, useful for understanding *why* specific token values were chosen).
