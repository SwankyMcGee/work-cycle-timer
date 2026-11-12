# Status — Ideas Engine ✅, GitHub Pages ✅, training materials ✅ (manual test passes pending)

Notes so we can pick up exactly where we stopped.

## 1. Google Form — DONE ✅ (link wired; final click-through test pending)

- **The Ideas Engine** is live: `https://forms.gle/bjPLDgdWpkLaNFEz5`

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

**Remaining:** push (ships restructure + all pages), verify live, then the
user's manual test pass: check all pages/nav links, print one-pager, home
menu cards, Ideas Engine card → form.
