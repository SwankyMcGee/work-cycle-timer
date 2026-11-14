# Status — Ideas Engine ✅, GitHub Pages ✅, training materials ✅ (manual test passes pending)

Notes so we can pick up exactly where we stopped.

## 1. Google Form — DONE ✅ (link wired; final click-through test pending)

- **The Ideas Engine** is live: `https://forms.gle/bjPLDgdWpkLaNFEz5`
  — **superseded 2026-11-12 by §7**: the themed `ideas.html` page now
  owns the front door; this form link survives only as that page's
  error fallback.

- **Agreed design (minimal, friction-free):** two fields only —
  1. "What's your idea?" — Paragraph, **required**
  2. "Name or email — only if you'd like a reply" — Short answer, optional
- User creates it themselves at `forms.new` — **the form is called
  "The Ideas Engine"** (user's name for it), description along the lines of
  "One box, no sign-in — every idea gets read.", links a response
  spreadsheet, then pastes the share link here.
- Whimsical confirmation message — **CHOSEN by user** (Responses →
  Confirmation message): "Gulp! The Ideas Engine swallowed your idea whole and
  looks pleased with itself. It reads every one — thanks for feeding it!"
- **WIRING DONE:** `app.js` → `const SUGGEST_URL = 'https://forms.gle/bjPLDgdWpkLaNFEz5';`
  — the Ideas button enables itself; in-app heading + button rebranded to
  **The Ideas Engine** / **Open The Ideas Engine** (footer keeps its
  "Suggest a feature" shortcut). Remaining: the user's click-through test —
  button opens the form, a test submission reaches the linked spreadsheet
  with the "Gulp!" confirmation showing.
- User confirmed `docs.google.com` is NOT blocked on the school network.
- App side is fully built: Settings → **Ideas** tab (5th tab), footer
  **Suggest a feature** shortcut in every tab.
- User created it themselves ✓ (in-app browser isn't signed into Google) —
  link received and wired today.

## 1b. Color palettes — DONE (pending user's manual test)

- **11 palettes** total: Calm, Lavender, Mint, Peach, Rose, Ocean, Low
  contrast, High contrast, Dark, Midnight, Warm dark.
- Settings → Display now has a **swatch picker** (replaces the old dropdown):
  one row per palette — name + 5 color chips [bg, card, text, accent/work,
  earn] — click applies instantly, active row gets accent border + ✓.
- `THEMES` registry near the top of `app.js` (line ~35) is the single source
  of truth: chips arrays feed the picker, and `loadSettings` validates
  `settings.theme` against it (unknown → falls back to Calm).
- **When editing chip hexes:** keep them in step with the matching
  `body[data-theme=...]` block in `styles.css` (lines ~33–210). Chips order
  = [bg, surface, text, accent, earn].
- Animations recolor automatically (`readAnimPalette()` reads
  `--work/--earn/--accent` from the live theme).
- Balance check passed (331/331 braces, 1428/1428 parens); no leftover
  `$('theme')` refs outside `Backup\`.
- **User's test pass (pending):** click each row → instant apply + ✓ moves;
  dials/animation colors follow; Reset all → Calm; reload → persists.

## 2. GitHub Pages hosting — DONE ✅ (live)

**Live URL: `https://swankymcgee.github.io/work-cycle-timer/`** (home menu)
**App URL: `https://swankymcgee.github.io/work-cycle-timer/timer.html`**
**Repo: `https://github.com/SwankyMcGee/work-cycle-timer`** (public)

**Site restructure (2026-11–12, shipped with the training materials):**
the app moved `index.html` → `timer.html` (`git mv`); the root `index.html`
is now a **clean chooser** — two doors only: **Tools** (`tools.html`: timer
+ Ideas Engine) and **Resources** (`resources.html`: the six staff guides) —
per the user's "less cluttered" request. Resource pages carry a compact
two-tier nav (Home · Tools · Resources + slim resource strip). The old root
link still lands somewhere useful (one click to the timer). Same origin, so
existing localStorage settings survive the move. User guide, scenarios and
troubleshooting were compacted at the same time.

**Repo split (2026-11-12, per user):** since more tools are coming, the
site is now **two repos on one domain**:

- **`SwankyMcGee/SwankyMcGee.github.io`** (new, local folder
  `Vibe Coding Projects\SwankyMcGee.github.io`) → **`https://swankymcgee.github.io/`**
  — the base site: chooser, `tools.html`, `resources.html`, the six staff
  guides, `site.css`. User site = root URL, no project name in the path.
- **`SwankyMcGee/work-cycle-timer`** (this repo) → keeps the **app only**:
  `https://swankymcgee.github.io/work-cycle-timer/timer.html`. Its root
  `index.html` is now a **redirect stub into `timer.html`**, so the old
  `/work-cycle-timer/` URL takes people straight to the app (user's choice:
  old URL → the work-cycle-timer repo, not the menu).
- Same origin (`swankymcgee.github.io`) → saved settings carry across.
- Site pages were `git rm`'d from this repo after copying to the base repo;
  app.js/timer.html never referenced them (verified by grep).

**Site name (2026-11-12, user's choice):** the collection is called
**The Learning Toolshed** — tagline **"Sensory-friendly tools for autistic
classrooms."** Applied to the base site's header brand, `<title>`s and home
page h1. The tool itself keeps its own name (Work Cycle Timer) wherever it
refers to the app (tools-page card, resource-page footers).

## 4. App changes — 2026-11-12 (audio + home button)

- **Never start with audio:** `applyMusic(autoplay)` gained a load-paused
  mode. `applyMusic(false)` on page init and on the IndexedDB file-restore
  path — a remembered track now loads **paused**; music only begins from a
  deliberate hold/pick/add. Also fixed: removing the current track while
  paused now loads the next track paused instead of starting it
  (`applyMusic(wasPlaying)`).
- **Home button (kid-safe):** new 🏠 button in the header between the music
  bar and the gear — **hold 1 second** (`makeHoldable`, `HOME_URL` const at
  the top of `app.js`) → navigates to `https://swankymcgee.github.io/`.
  Reuses the `.gear-btn` box with `.home-btn { --hold-dur: 1s }`. Needs
  internet only when pressed; the timer itself still works fully offline.
- Materials updated (base repo): user guide (opening step + music-bar
  bullet), settings reference (header table + hold-duration table).
- Balance check passed: 360/360 braces, 1577/1577 parens.

How it went (2026-11-11):
- `gh` 2.103.3 installed via winget — the MSI needed **one UAC prompt**,
  which the user accepted; gh lives at `C:\Program Files\GitHub CLI\gh.exe`
  (new shells see it on PATH)
- Auth: `gh auth login --web` device flow — user authorized in a console
  window; account **SwankyMcGee**
- Repo created with `gh repo create work-cycle-timer --public --source=. --push`
- `.gitignore` = `Backup/` (first attempt failed silently — `Out-File -Path`
  is invalid, it's `-FilePath` — caught it, amended the commit; final push
  = 14 files, no Backup, ~27 MB of WAVs included)
- Pages enabled via `gh api .../pages -X POST -f source[branch]=main -f source[path]=/`,
  first build reached **built**; live URL verified serving the whole app
- Git identity is **repo-local** only: user.name = SwankyMcGee,
  user.email = SwankyMcGee@users.noreply.github.com

**Shipping an update (I drive it, from the project folder):**
`git add -A` → `git commit -m "..."` → `git push`
Pages rebuilds automatically (~1 min). Check with
`gh api repos/SwankyMcGee/work-cycle-timer/pages/builds/latest`.

**Still to verify:** open the live link once on the school network
(github.io may or may not be filtered — same check we did for docs.google.com).

## 5. Fullscreen + shared palette — 2026-11-12

- **Fullscreen (header ⛶, hold 1 s):** `toggleFullscreen()` runs the
  Fullscreen API on `document.documentElement` (webkit fallbacks included);
  `:fullscreen` CSS drops the width cap, pins the header (title + top
  buttons) to the top, centers the tool below it and grows the dials
  (`min(36vw, 46vh, 520px)`). The centering is two auto margins —
  `margin-top` on `.timers`, `margin-bottom` on `.cycle-line` — so if
  content ever outgrows the screen it scrolls instead of clipping. On enter, best-effort
  `screen.orientation.lock('landscape')` — Android Chrome only; desktop
  and iOS ignore the lock but fullscreen itself still works. Unlocked on
  any exit including Esc (`fullscreenchange` → `syncFullscreenUi()` swaps
  the ⛶/exit icons, `title` and `aria-label`). Wired with
  `makeHoldable($('fsBtn'), 1000, …)`.
- **Shared palette on every page and tool:** new `site.js` (base repo)
  reads/writes the same `workCycleTimer.settings.v1` key (field `theme`),
  applies `html[data-theme]` **before first paint** (no flash), and
  injects a 🎨 **Palette** button + 11-palette panel into every site
  header. `site.css` gained 11 `html[data-theme]` blocks mirroring the
  app's values (mapped: `--dim` ← `--text-dim`, `--why-*` ←
  surface-2/border, `--hold-*` ← `--warn-*`) plus picker styles and a
  gentle body background/color transition. Writes are read-patch-write so
  the timer's other settings are never clobbered. Both sides listen for
  `storage` events → picking a palette in the timer updates open site
  pages live, and vice versa. `THEMES` in `site.js` must stay identical
  to `THEMES` in `app.js` (noted in both files; base README's
  "Adding a tool" recipe step 4 covers new pages).
- Materials updated (base repo): settings-ref (⛶ rows in the hold and
  header tables, shared-palette note on Color theme), user guide (hold
  callout, opening step, Color theme bullet, ⛶ header bullet), README
  (`site.js` row + recipe step). Training brief §3 (timer repo): header
  bullet, hold-table row, Display shared-palette note.
- Balance check passed: app.js 379/379 braces, 1628/1628 parens;
  site.js 33/33 braces, 103/103 parens.

## 6. Home page spruce-up — 2026-11-12 (site repo)

- **Hero:** inline-SVG toolshed illustration beside the title (two-column
  ≥760px, stacked below), custom SVG toolbox/book icons replacing the
  emoji (emoji render differently per machine), and the two chooser cards
  restyled as **doors** (user feedback rounds below).
- **Door cards, v2 — signs + swing (user feedback rounds: planks
  distracted from the text; wanted a swing-open with a peek at the next
  page; then "text as signs with nails"; then "entirely text signs —
  tighten the text, let the door show through"):** three layers per
  card — `.door-recess` (absolute inset 5px: a palette-themed
  inline-SVG mini preview of the destination page — header bar, title,
  cards — with an inset doorway shadow) → `.door-face` (**in flow**,
  `flex:1`/`min-height:190px` — it is what gives the card height;
  whisper plank seams `rgba(127,127,127,.07)` every 46–48px over
  `--surface-2`, so the door is a slightly different shade from the
  sign) → `.door-sign` (opaque `var(--surface)` plate with **tightened**
  padding `.9rem 1.05rem` and `margin:18px 26px` — a door frame shows
  on all four sides; four `.nail` corner dots with a `radial-gradient`
  metal highlight; texture never sits behind words). Hover/focus swings
  the face `rotateY(-34deg)` on a **right** hinge
  (`transform-origin:right center`) — the door recedes, its projection
  shrinks, and an ~80px strip of the preview appears along the left
  edge (right hinge chosen so the strip shows the mock's header/title,
  the most page-like part); `perspective:1400px` on the card. Old
  knob/tilt rules removed; under `prefers-reduced-motion` the door
  snaps open instead (transition off, swing kept) so the preview stays
  reachable.
- **Background patterns (toggleable):** whisper-quiet per-palette motifs
  on the home page only — clouds (calm, peach), waves (ocean, mint),
  stars (midnight, dark, warm), sparkles (lavender, rose); low contrast
  and high contrast stay deliberately plain. One grayscale SVG tile per
  family at 7–9% alpha on `body.home::before` (`z-index:-1`). Off switch
  = **Background patterns** row at the bottom of the 🎨 Palette panel;
  stored as `homeMotifs` in the shared settings key (read-patch-write,
  never clobbering the timer's fields), applied pre-paint with a
  `motifs-off` class on `<html>`, synced across tabs.
- **Jump-back card:** third chooser card ("Pick up where you left off")
  showing the last page read — **every page except home** (user's call:
  the hubs count too; the original build excluded Tools/Resources as
  door-duplicates). Recorded per page in a site-only key
  `workCycleTimer.site.v1`; render guards on `PAGE_NAMES`. Note: `.card`
  sets `display:block`, which beats the UA `[hidden]` style, so both the
  jump card and the ribbon carry explicit `[hidden] { display:none }`
  guards.
- **Clouds redrawn (user feedback: paired ellipses weren't cloud-like):**
  each cloud is now a flat-ish base ellipse plus bump circles of
  differing radii, composited with **group `opacity`** (not
  `fill-opacity`) so overlaps flatten first and never seam-darkens.
  Four distinct silhouettes per tile — wide three-bump, tall round,
  small low, thin wisp.
- **Delight:** what's-new ribbon (version-keyed dismiss in
  `workCycleTimer.site.news`, hidden pre-paint via a `news-off` class —
  no flash), quick-links pills (Quick start / User guide /
  Troubleshooting), footer 💡 Ideas Engine nudge (the existing form),
  and easter egg #2 — click the home title 5 times within 2.5s of each
  other and a cat appears by the shed (same trick as the timer's title).
- Balance check passed: site.js 66/66 braces, 191/191 parens; app files
  untouched this round (379/379, 1628/1628).

## 7. Ideas Engine → themed page + Google Sheet — 2026-11-12 (site repo)

- **Why:** the Google Form sent staff off-site and couldn't be themed;
  GitHub Pages is static, so submissions need an external writer either
  way. User chose: **themed form → Google Sheet** (keeps the Form's
  data readability).
- **Front end:** new `ideas.html` — the agreed two fields ("What's your
  idea?" required · "Name or email — only if you'd like a reply"), our
  header/palette/theming, honeypot + 3-second timing gates (invisible),
  hidden `page` field. Success state reuses the Form's "Gulp!"
  confirmation word for word; error state offers the old Google Form as
  a fallback link. `site.js` gains `IDEAS_ENDPOINT` (empty until
  deployed → the button disables and points at SETUP.md) plus
  `initIdeas()`, which posts `FormData` (simple request, no preflight).
- **Backend:** `ideas-engine/Code.gs` (Apps Script web app — `doPost`
  appends `When | Idea | Name or email | Page` rows to an `Ideas`
  sheet, header + frozen row created on first use; honeypot / faster
  than 3s / empty idea → fake success so bots don't retry; `doGet` is
  the smoke test) + `ideas-engine/SETUP.md` (5-step deploy: sheet →
  Extensions/Apps Script → paste → Deploy as *Me* / *Anyone* → copy
  `/exec` URL).
- **Wiring updates:** index footer nudge + tools card → `ideas.html`;
  troubleshooting (2 spots), user-guide, settings-ref, glossary and the
  site README updated — the only remaining `forms.gle` link on the site
  is ideas.html's error fallback; `app.js`
  `SUGGEST_URL = 'https://swankymcgee.github.io/ideas.html'` (+ comment
  rewrite + not-connected hint); training brief and timer README no
  longer say "Google Form" (they now say the idea page).
- **PENDING → SHIPPED:** endpoint smoke-tested (`doGet` →
  `{"ok":true,"service":"The Ideas Engine"}`), `IDEAS_ENDPOINT` wired,
  site pushed. **Live end-to-end test passed from the browser**: filled
  the form on `ideas.html`, submitted, the "Gulp!" confirmation appeared
  — CORS and `doPost` both fine (one bug found and fixed on the way:
  `.idea-form { display:flex }` beat the UA `[hidden]` rule, so the form
  didn't hide after success — added an `.idea-form[hidden]` guard, same
  pattern as the jump card). Timer push follows the site (its
  `SUGGEST_URL` must not point at a page that doesn't exist yet).
  Remaining: user confirms the TEST row landed in the sheet (then
  deletes it) + the usual manual test pass.
- **Follow-up round (user):** footers now read "Staff resources for The
  Learning Toolshed" (all seven pages that had the old phrase); the form
  opens with a required tool-or-feature question — feature ideas reveal
  **"Which tool is it for?"**, a select with the placeholder
  `-Select A Tool-` styled like the resources picker, whose options are
  built from a new **`TOOLS`** list in `site.js` (single registration
  point for new tools; README recipe step 2 updated) and `required`
  follows visibility so a hidden select can never block a send.
  Backend columns are now `Type | When | Idea | Name or email | Which
  tool` — `Type` (`Tool`/`Feature`) is the new first column, the old
  `Page` field/column is replaced by the feature's tool;
  `ensureSheet_()` rewrites a pre-Type header on the next submission.
  "One box" wording → "A couple of quick questions" (ideas page +
  glossary).
- **Logo round (user):** the home hero's inline-SVG shed is replaced by
  a pasted logo image (`toolshed-logo.png`, 600x335 transparent PNG —
  cartoon shed + wordmark), committed to the site repo and served from
  the root. Because the image carries the words, the visible `<h1>` is
  now `.visually-hidden` (structure/screen readers keep it); the logo
  sits **directly on the themed background** (user wants the PNG's
  transparency honored — an earlier always-light `.logo-plate` behind
  it was removed). Wordmark contrast on dark palettes solved with
  **option B (user's pick):** a generated light-wordmark twin
  (`toolshed-logo-light.png` — same art/alpha, only the wordmark's
  dark-slate pixels recolored to `#e7edf2`, produced by detecting the
  wordmark band below the shed's transparent gap), swapped in by a
  CSS rule keyed to the four dark `data-theme`s
  (`high`/`dark`/`midnight`/`warm`) via `content: url(...)` — no JS,
  no flash (`data-theme` is set before first paint), transparent in
  both variants; README notes the selector must grow with any new
  dark palette. Hero is now a centered single column (logo, tagline,
  ask) instead of the two-column grid. The cat easter egg moved from
  the title to the logo (5 clicks within 2.5s, `#logoPlate`),
  re-homed into the logo's bottom-right corner with `var(--text)`
  fill so it follows the palette. Reduced-motion still snaps it in
  (`transition: none` kept). Also in this round: the three footers
  that never got the rename (home, tools, resources) now read
  "Staff resources for The Learning Toolshed" — all ten pages match.
  README structure table updated (logo rows + hero description).

## 8. Math Playground — BUILT ✅ (live; manual play-test pending)

**Repo:** `SwankyMcGee/math-playground` (new, public, `main` → root Pages).
**Live:** `https://swankymcgee.github.io/math-playground/` — first build
`built` at commit `121be8d`, 2026-11-14.

Four calm math games for autistic students, all inline SVG art (no image
generator exists in this session, so nothing was raster-generated), no
network calls on load:

| Page | Game |
| --- | --- |
| `counters.html` | ten-frame, **pointer drag-and-drop** (tap kept as a touch/keyboard fallback) |
| `number-line.html` | **draggable hopper + big −/+ buttons**, live distance badge (−3 / +7 / 0), choices gated until the hopper reaches the landing |
| `facts.html` | one fact, three big choices, hint |
| `story.html` | picture story + scene icons + proportional bar model |

Every game has grade-level and math-operations pickers (CCSS bands; ops that
do not apply are disabled with a plain-language label).

**Scoring rule (user's wording):** all four games keep score — *successes
only*; skips and reveals never add to it. Round of 5 ends on a
congratulatory screen (🎉 "Nice work!", "You got 4 of 5 right this round.",
"Total score: N", "Play again?"). Wrong answers stay silent/neutral; after
two tries the answer is shown kindly and that problem scores nothing.

**Storage:** play settings + score in `localStorage["workCycleTimer.math.v1"]`
(`{grade, ops, sound, last, score}`); theme/motifs still shared through
`workCycleTimer.settings.v1`, so the palette follows from the site and timer.

**Site hooks (this repo):** `TOOLS` in `site.js` += `Math Playground` (the
Ideas Engine dropdown picks it up by itself) and a new card on `tools.html`.
README's "tools live in their own repos" paragraph now lists both repos.

**Verified in-browser (local server, then live):** zero console errors on all
five pages; grade/operation chips; score pill persists across games and
pages; wrong → neutral, no score; reveal → no score; congrats screen +
Play again reset; counters drag-in/drag-out with hover highlight and clean
teardown; number-line badge, gating, and locked-choice message; motif
off-toggle; palette (11) persists across pages.

**Update — same day (user's follow-up):**

- *Counters numbers got smaller*: `GAME_CEILING.counters` 50 → **20**, so the
  board never exceeds **two ten-frames** and the student drags far fewer
  counters. The page's own note follows automatically ("… numbers up to 20
  for Grade 2"); Grade K still clamps to 10.
- *Counters carries spare counters*: every problem now brings **3–5 spares**
  (`SPARE_MIN`/`SPARE_MAX`), so the tray always holds more than the problem
  needs — pressing Check with the whole pile dragged in is deliberately wrong,
  and the student has to count to b instead of emptying the tray. The frames
  are sized for `answer + spares` (three ten-frames at most) so the wrong guess
  still fits. Subtracting gets spares too: they sit in the tray, are refused
  with a neutral nudge ("Those are spares — take counters out of the frames
  instead.") on both the tap and the drag path (no drop highlight), and the
  tray label/aria text tell them apart from counters already taken out.
  Verified: all-in check → neutral, no score; correct count → +1; two wrongs →
  reveal leaves the spares in the tray and scores nothing.
- *Number Line gets a magnifier*: the SVG viewBox grew (`0 0 560 204`, baseline
  moved to y=150) to make room above the line. When the hopper sits on the
  landing, the circle switches to `at-answer` — **fill-opacity .12 (see-through)
  with a 3px `--accent2` outline** — and a **magnifying glass floats over the
  number**: opaque lens ring + handle pointing down at the hopper, with the
  number set at 24px over a short piece of line and three ticks inside the
  glass. Toggling is live: hop off the landing and the glass disappears, the
  circle goes solid again, and the choices re-lock. The lens is
  `pointer-events: none`, clamped inside the viewBox, and measured clear of the
  badge, the axis numbers and the start-number label (min 4px gap) for every
  operation. For division the circle sits on the dividend, so the glass shows
  that number (the choices stay the jump count). Hero line updated to match.

## 3. Staff training materials — BUILT ✅ (hosted; test pass pending)

**Confirmed with the user:** the full §5 gamut — all six deliverables, as
**hosted pages on the live site** (print-friendly), staff open the app by
**link only** (materials deep-link `timer.html`), plus a **new home page**
menu at the root. Ground rules (§6) applied: only documented behavior,
exact on-screen wording, every sensitive button says it must be **held** with
its duration, dated November 2026.

**Delivered (all linked from the home menu, shared `site.css`, nav bar on
every page, "App state: November 2026" in every footer):**

| Page | Deliverable |
|---|---|
| `quick-start.html` | (a) One-page start-here for staff |
| `user-guide.html` | (b) Full task-based user guide (organised by settings tab) |
| `settings-ref.html` | (c) Settings reference table (every setting + default) |
| `troubleshooting.html` | (d) Troubleshooting FAQ |
| `scenarios.html` | (e) Four scenario walkthroughs (standard day, 3 cycles, calm sensory, silent classroom) |
| `glossary.html` | (f) Glossary of all terms |
| `index.html` | NEW home chooser — Tools / Resources doors (bonus, agreed) |
| `tools.html` / `resources.html` | The two hub pages |

Exact strings were re-verified against `app.js` before writing (including
the inactive-card status **"Waiting"**, which §3 of the brief had missed).
The brief `STAFF-TRAINING-PROMPT.md` got a status line.

**Remaining:** user's manual test pass — check all pages/nav links at
`https://swankymcgee.github.io/`, print one-pager, chooser → Tools → timer,
and the old `/work-cycle-timer/` URL redirecting into the app.
