# Where we left off — suggestions form ✅ DONE, publishing (PAUSED)

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

## 2. GitHub Pages hosting — paused at the install question

**Goal:** host the app and send out one link. User does not want to use
GitHub's website UI — I drive everything; they only sign in once.

**Decided so far:**
- Google Sites **cannot** host the app itself (it's a page builder, not a
  general host — no scripts/multi-file/audio). It can only embed or link to
  something hosted elsewhere. → GitHub Pages is the chosen path.
- Repo must be **public** (free-plan requirement for Pages) — fine, the point
  is a shareable link.
- `Backup\` folder must be excluded (`.gitignore`: `Backup/`) so the old copy
  isn't published at `/Backup/`.
- Repo name: `work-cycle-timer`, source = branch `main`, root (`/`).

**Machine state (verified):**
- `git` 2.55.0 ✓ · `winget` 1.29.380 ✓ · **`gh` (GitHub CLI) NOT installed ✗**
- Project ≈ 27 MB live (five WAVs, 4–6.4 MB each) — well within GitHub limits
  (100 MB/file) and Pages (1 GB).

**Open question the user paused on:** OK to install the GitHub CLI per-user
via winget (no admin, ~10 MB, uninstall anytime)?
- **If yes:** `winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements`
- **If no installs:** automate github.com in the in-app browser instead
  (user signs in; I click through repo creation, file upload in ≤5 MiB
  batches, then Settings → Pages).

**Full plan once resumed:**
1. Install `gh` (or fall back to browser automation)
2. `gh auth login` device flow — user does **one** browser authorization
   (or signs up for an account if they don't have one)
3. `git init` in the project folder + `.gitignore` (`Backup/`) + commit
4. `gh repo create work-cycle-timer --public --source=. --push`
5. `gh api repos/{owner}/work-cycle-timer/pages -X POST -f source[branch]=main -f source[path]=/`
6. Poll `gh api repos/{owner}/work-cycle-timer/pages/builds/latest` until built
7. Open the live URL, verify the app loads (hold-gear, timers, playlist),
   hand the link over
