# Prompt: Build staff training materials for the Work Cycle Timer

> **STATUS (November 2026): §5 confirmed and built ✅** — all six deliverables
> (quick-start, user guide, settings reference, troubleshooting, scenarios,
> glossary) confirmed as **hosted pages** (print-friendly), staff open the app
> by **link only**. **Hosted in the separate `SwankyMcGee.github.io` repo at
> `https://swankymcgee.github.io/`** (home chooser → Tools / Resources hubs),
> after the 2026-11-12 repo split; the app itself stays in the `work-cycle-timer`
> repo at `https://swankymcgee.github.io/work-cycle-timer/timer.html`.
> Built under the §6 ground rules: exact wording, holds with durations, dated
> November 2026. Remaining: push + user test pass.

You are an instructional designer creating training materials that teach school
staff to use the **Work Cycle Timer** app confidently. You have no other context
about this app — everything you need is in this prompt. Before you start
building, ask me any clarifying questions you need (format, length, delivery
medium, tone); when those are answered, produce the materials described below.

---

## 1. What the app is

A sensory-friendly **Work ↔ Earn cycle timer** designed for autistic students
(weighted toward moderate–severe support needs). Two semi-circle dials sit side
by side; the active dial **fills as time passes**, so "5 minutes" becomes
something concrete and visual (the same idea as a Time Timer's shrinking disk).

- **Work** (default 10:00) → hold **Start** → dial fills → time's up → **Earn**
  (default 5:00) → and back again, all day
- The inactive timer stays visible but dimmed, showing its full length
- The pedagogical model: predictable structure, visible time, and an earn
  block that motivates work — used for class routines, individual targets,
  transitions, and sensory-friendly classrooms

**How it runs:** pure HTML/CSS/JS. Double-click `timer.html` — opens in
Chrome/Edge/Firefox. No install, no admin rights, no internet, no network
calls. Settings persist in the browser's `localStorage` **on that machine
only**. Suitable for IT-managed school laptops.

## 2. Who the training is for

- Classroom **teachers, teaching assistants, learning-support staff, and
  cover/substitute staff** — mixed levels of tech confidence
- They will often use the app **live while supporting students**, so materials
  must be scannable: short steps, clear headings, exact button labels
- The students are autistic children and young people, including some with
  significant sensory sensitivities — staff should understand *why* features
  behave gently, not just *how* to use them

## 3. Complete feature reference — be exact, never invent anything

### Main screen

- **Header:** editable title (small embossed pencil button beside it — click to
  edit, Enter saves, Esc cancels; persists across loads), a **music bar**, a
  **⛶ fullscreen button**, a **🏠 home button**, and the **settings gear**
- **Two timer cards:** Work and Earn. Active card is bright; the other is
  dimmed. Each shows the dial, remaining time, a status word
  (Ready / Running / Paused / Time's up) and the total ("of 10:00")
- **Bottom line:** e.g. "Work 10:00 · Earn 5:00 · Next up: Earn"
- **Banner strip** above the dials: transition warnings and finish messages
- **Three controls:** **Reset** · big colored **Start Work / Pause / Resume**
  (label changes with state) · **Skip →**

### Hold-to-activate — the single most important thing to teach

Every sensitive control requires a **continuous press**; a quick tap does
nothing (this stops accidental brushes by students):

| Control | Hold |
|---|---|
| Start / Pause / Resume, Skip →, Reset | **1 second** |
| Music: ⏮ previous, ▶ play/pause, ⏭ next | **1 second** |
| Fullscreen ⛶ (header, before 🏠) | **1 second** |
| Home 🏠 (header, between the music bar and the gear) — opens the site's home page | **1 second** |
| Settings gear (top-right) | **3 seconds** |

A thin bar fills along the bottom of the button while held — let it fill
completely and the action fires; release early and nothing happens. Works with
mouse, touch, and keyboard (hold Enter or Space). Holding a key down does not
re-trigger; you must release first. **Always mention the hold when your
materials describe pressing any of these buttons.**

### End-of-cycle behavior — Settings → Timers → "When time is up"

| Option | Behavior |
|---|---|
| **Pause** (default) | Banner "Work is finished! Earn is next." and waits for Start |
| **Switch automatically** | Quiet chime, other timer starts on its own after a moment |
| **Switch after 10 seconds** | 10-second countdown banner, then switches |

Default is deliberately **pause**: the person using it is never rushed into a
transition.

### Work cycles per earn — Settings → Timers → −/+ stepper (1–10, default 1)

For classes that do several work blocks before a break:

- Setting **3** gives: Work → Work → Work → **Earn** → Work → …
- **Progress badge on the Work card:** "Cycle 2 of 3" with one pip per cycle —
  solid = done, bright = running now, hollow = still to come (badge hidden
  when the setting is 1)
- **Bottom line** shows what's next: "Next up: Work cycle 2 of 3", then
  "Next up: Earn" on the last cycle
- **Finish banner counts along:** "Work cycle 1 of 3 is finished! Work cycle 2
  of 3 is next."
- **Reset zeroes the count** (starts the whole progress over); **Skip advances
  the sequence** without waiting; changing the setting also restarts the count;
  the count restarts after each Earn
- Every work cycle gets its own full timer, warnings, chime and flash

### Settings (open by holding the gear 3 seconds; side-nav tabs; Done closes)

- **Timers:** cycle lengths — work and earn, any length, **minimum 10
  seconds**, defaults 10:00 / 5:00 (changes apply right away when the timer is
  not running) · work cycles per earn stepper · when-time-is-up · transition
  warnings (master switch + 2 min / 1 min / 30 sec options; default: on, with
  1 min and 30 sec)
- **Alerts:** sound — on/off, volume, three gentle sounds (**soft chime**,
  gentle bell, single ping) with a **Test** button (default: on, chime, 50%) ·
  screen flash — slow gentle pulse at time's up (**off by default**, one click
  for light-sensitivity needs)
- **Display:** large text mode · **eleven color palettes** in a swatch list —
  each row shows the name with little color squares beside it (page background,
  card, text, both dial colors); click a row to apply it instantly, the current
  one is highlighted with a ✓ (**Calm** default; then Lavender, Mint, Peach,
  Rose, Ocean, Low contrast, High contrast, Dark, Midnight, Warm dark) ·
  layout: side-by-side (default) or one timer at a time. The same eleven
  palettes are on every site page under its 🎨 **Palette** header button, and
  the choice is remembered across pages and the timer alike
- **Media:** built-in **sensory animation** — Floating bubbles, Drifting soft
  glow, Slow waves, Gentle rain (drops fall with gravity and splash), with an
  opacity slider · **Animation reactivity** — Off / Gentle (default) /
  Noticeable: bubbles bump into each other and occasionally pop, waves swell
  and crash into foam; Off = plain drifting · no files needed · background
  video with opacity · background
  music with volume · **Add video** picker — session only, re-pick after a
  refresh · **Music playlist:** **Add music files** drops tracks into one
  visible list — drag the dotted handle to reorder (or focus it and press ↑/↓),
  click a name to jump to it, **×** removes a track, **Restore removed** brings
  back built-ins, **Shuffle** randomizes, **Repeat** cycles *Off → Playlist →
  One song* (Off plays through once and stops, Playlist wraps forever, One song
  loops the current track) — order, repeat mode and added files are saved with
  your settings · footer has **Done**, **Reset**, and a **Suggest a feature**
  shortcut (Reset-all confirms first and restores defaults; a custom title is
  kept)
- **Ideas:** **The Ideas Engine** — **Open The Ideas Engine** launches the
  idea page in a new tab (that click needs internet; the app itself works
  offline). The footer's **Suggest a feature** button jumps straight to this
  tab. Staff use it to request new features or whole new tools

### Music bar (header, next to the gear)

- **Track dropdown** listing the playlist (the five built-in tracks plus any
  added files) — picking one switches to it and starts playing
- **⏮ / ▶ pause / ⏭** buttons (hold 1 s) — prev/next wrap through the playlist;
  from *None*, next starts the first track and plays; when the playlist runs
  out with **Repeat: Off**, play starts it over from the top
- **Volume slider** — the same setting as Settings → Media music volume; moving
  either moves the other (default 30%)
- Switching tracks while paused stays paused; play with no tracks yet shows a
  banner pointing to Settings → Media
- **Never starts with audio** — the app opens with music paused, even if a
  track was selected last session; sound only ever begins from a deliberate
  hold or pick
- **🏠 home button** (header, between the music bar and the gear) — hold
  **1 second** to leave the timer and open the site's home page (needs
  internet when pressed; the timer itself works offline)

### Built-in music — five original warm-pad loops (safe for school use)

Warm pad (gentle chords) · Warm pad (slow strings) · Warm pad (soft organ) ·
Warm pad (felt piano) · Warm pad (breathing pulse). All are synthesized from
scratch (math, not recorded music) — **no copyright concerns**; designed to be
simple, predictable, instrumental, warm and never sudden (research: Kalas 2012
simple music for severe autism; Michel 2024 instrumental > vocal; Lundqvist
2009 vibroacoustic; Dwyer 2025 / Frontiers 2026 on avoiding sudden/loud
sounds — see README for citations).

### Optional fun aside

Clicking the title **5 times** reveals a hidden Windows logo that fills the
screen with an XP-hills scene. Include this only in a "tips & fun" section if
the tone allows — it is not required knowledge.

## 4. Sensory-friendly design principles — apply them to the materials too

- **Gentle and predictable:** no sudden elements, no flashing, calm wording
- **Plain language:** short sentences, numbered steps, no jargon, exact
  on-screen labels in quotation marks (e.g. hold **"Start Work"** for 1 second)
- **Scannable layout:** white space, clear headings, tables for references —
  a stressed staff member should find an answer in under a minute
- **Explain the why briefly:** features are gentle on purpose (soft chimes not
  beepers, slow flash, pause-at-end, hold-to-activate) — staff who understand
  the reason are less likely to override them

## 5. Deliverables — confirm this set with me before building

1. **Quick-start one-pager:** open the file → set timers → hold Start →
   what the dials mean → how to open settings
2. **Full user guide:** task-based, organized to match the app's settings tabs
3. **Settings reference table:** every setting | where it lives | default |
   what it does
4. **Troubleshooting FAQ:** nothing happens when I tap (holds!), no sound,
   settings not remembered (localStorage), video gone after refresh (music is
   remembered in the playlist), added music missing after a refresh (the
   browser may block storage on `file://` pages — just add the files again),
   cycle shorter than 10 s won't save, how to fully reset, sound
   feels too loud/quiet
5. **Scenario walkthroughs:** (a) standard work/earn day, (b) three work cycles
   before earn, (c) calm sensory setup (animation + music + theme), (d) fully
   silent visual-only classroom
6. **Glossary:** Work, Earn, cycle, work cycles per earn, Skip, Reset, hold to
   activate, banner, pad, theme, layout

## 6. Ground rules

- **Only document the behavior listed in this prompt** — never invent
  settings, shortcuts, or features. If the app seems to do something not
  described here, ask me instead of guessing
- Use the **exact on-screen wording** for every control and message
- When describing any sensitive button, say it must be **held**, with the
  duration
- Ask me before building if anything is ambiguous or if you need decisions on
  format, audience seniority, length, or branding
- Date the materials (app state as of November 2026) so future updates are
  easy to spot

## 7. Source files (if you need to verify behavior)

The app lives beside this prompt: `timer.html` (structure), `styles.css`
(themes/layout), `app.js` (timer engine, settings, sound, media),
`media/playlist.js` (track list), `README.md` (full documentation plus the
research notes and GitHub Pages deployment notes).
