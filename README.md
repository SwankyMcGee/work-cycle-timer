# Work Cycle Timer

A sensory-friendly **Work ↔ Earn** cycle timer for autism support. Two semi-circle
dials sit side by side — the active dial **fills as time progresses**, cut off at the
exact remaining time (at half elapsed it looks like a perfect semi-circle). When one
cycle ends, the next one is ready to go.

## How to run

No installation, no admin rights, no internet required:

1. Double-click **`timer.html`** (the app itself).
2. It opens in the browser (Edge/Chrome/Firefox).
3. **Hold Start Work** for one second (a little bar fills across the
   button — quick taps do nothing, on purpose).

Double-clicking **`index.html`** instead opens the **home page** — a chooser
with just two doors: **Tools** (the timer, The Ideas Engine) and
**Resources** (the six staff guides) — one click from the timer.

Everything (settings, theme, sounds, your music playlist — order, repeat mode and
added music files) is remembered between launches via the browser's local storage
and IndexedDB. Nothing is ever sent over the network.

## Website (GitHub Pages)

**Live: `https://swankymcgee.github.io/work-cycle-timer/`** — publishing is
driven locally (`git add -A` → `commit` → `push`; Pages rebuilds in ~1 min).

| Page | What it is |
|---|---|
| `index.html` | Home — just a chooser: **Tools** or **Resources** |
| `tools.html` | Tools hub — timer card + Ideas Engine card |
| `resources.html` | Resources hub — the six staff-resource cards |
| `timer.html` | **The app** (`https://…/work-cycle-timer/timer.html`) |
| `quick-start.html` | One-page start-here for staff |
| `user-guide.html` | Full task-based guide, organised by settings tab |
| `settings-ref.html` | Every setting: location, default, behavior |
| `troubleshooting.html` | Symptom → fix FAQ |
| `scenarios.html` | Four walkthroughs: standard day, 3 cycles, calm sensory, silent room |
| `glossary.html` | Plain-language terms |
| `site.css` | Shared styling + print styles for all site pages |

The old root link (`…/work-cycle-timer/`) still works — it now lands on the
home menu, one click from the timer. All staff materials deep-link to
`timer.html` and are print-friendly (Ctrl+P → clean paper output). Materials
are dated **November 2026** to match the app's state.

## The cycle

- **Work** (default 10:00) → hold **Start** → dial fills → time's up
- **Earn** (default 5:00) → same, and back again
- Both timers are always visible; the inactive one stays dimmed and shows its full length
- **Reset** (hold 1 s) restarts the current cycle · **Skip →** (hold 1 s) ends the
  current cycle and starts whatever comes next in the sequence

### When time is up (Settings → "When time is up")

| Option | Behavior |
|---|---|
| **Pause (default)** | Gentle banner "Work is finished! Earn is next." and waits for **Start Earn** |
| **Switch automatically** | Quiet chime, then the other timer starts on its own after a moment |
| **Switch after 10 seconds** | Shows a 10-second countdown, then switches |

### Multiple work cycles per earn (Settings → Timers)

Some classes do more than one work block before a break. **Work cycles per
earn** (default **1** — the classic work/earn alternation) sets how many work
cycles must finish before the Earn cycle starts:

- With **3** selected: Work → Work → Work → **Earn** → Work → …
- The bottom line always shows what's next: *"Next up: Work cycle 2 of 3"*,
  then *"Next up: Earn"* on the last one
- A **progress badge on the Work card** shows where you are right now —
  *"Cycle 2 of 3"* with a pip per cycle: solid = done, bright = running now,
  hollow = still to come (hidden when the setting is 1)
- The finish banner counts along too: *"Work cycle 1 of 3 is finished!
  Work cycle 2 of 3 is next."*
- The count restarts after each Earn, when the setting is changed, and on
  **Reset** (so Reset really starts the whole thing over); **Skip** advances
  the sequence without waiting
- Every work cycle gets its own full timer, warnings, chime and flash — only
  the Earn waits for all of them

## Kid-safe controls (hold, don't tap)

Every sensitive control needs a **continuous press** — a quick tap does
nothing, so an accidental brush can't start, skip or reset anything:

| Control | Hold time |
|---|---|
| **Start / Pause / Resume**, **Skip →**, **Reset** | 1 second |
| Music: **⏮ previous**, **▶ play/pause**, **⏭ next** | 1 second |
| **Settings gear** (top-right) | 3 seconds |

A thin bar fills along the bottom of the button while you hold: let it fill
completely and the action fires; release early and nothing happens. Works with
mouse, touch and keyboard (hold **Enter** or **Space**). Holding a key down
doesn't re-trigger the action — you must release first.

## Music controls (header, top-right, next to the gear)

A small music bar sits in the header: a **track dropdown**, **previous /
play-pause / next**, plus a **volume slider**.

- The dropdown lists the current playlist (the five built-in pads plus any files
  added in Settings → Media) — picking one switches to it and starts it playing
- Prev/next walk the playlist and wrap around; from *None*, next starts the
  first track (and actually starts playing)
- Switching tracks while paused stays paused — it never surprises you with sound
- When the queue runs out with **Repeat: Off**, the play button starts the
  playlist over from the top
- The volume slider is the same setting as Settings → Media → music volume;
  moving either one moves the other
- With no tracks yet, play/pause shows a gentle banner pointing to
  Settings → Media

## Settings (hold the gear, top-right, for 3 seconds)

The hold-to-open gear sits at the top of the app, out of easy reach for smaller
students, and can't be opened by an accidental tap. Settings use a side-navigation
layout (like a WordPress admin page): pick **Timers**, **Alerts**, **Display**,
**Media**, or **Ideas** from the menu on the left, with a **Done** button at the
bottom — so nothing is buried in one long list.

- **Cycle lengths** — work and earn, any length (min 10 seconds), defaults 10:00 / 5:00
- **Work cycles per earn** — how many work cycles finish before the Earn cycle
  starts, set with a **−/+ stepper** (1–10, default 1); the count restarts after
  each Earn and on Reset
- **Transition warnings** — soft banner (and optional quiet chime) at 2 min / 1 min / 30 sec left
- **Sound** — on/off, volume, three gentle sounds (soft chime, gentle bell, single ping), Test button
- **Screen flash** — slow gentle pulse at time's up; off by default for light sensitivity is one click away
- **Display** — large text mode, **eleven color palettes** in a swatch list —
  every palette shows its name next to live color chips (page background, card,
  text, and both dial colors) so you can see what you're picking: Calm, Lavender,
  Mint, Peach, Rose, Ocean, Low contrast, High contrast, Dark, Midnight,
  Warm dark — click one and it applies instantly,
  side-by-side or one-timer-at-a-time layout
- **Sensory animation (built in)** — four gentle, slow-moving animations drawn right in the app
  (Floating bubbles, Drifting soft glow, Slow waves, Gentle rain — drops accelerate with gravity
  and splash on the floor) with an opacity slider — calming visuals out of the box,
  **no video files needed** — plus an **Animation reactivity** setting (Off / Gentle / Noticeable)
  that adds gentle physics: bubbles bump into each other and occasionally pop on a hard knock,
  waves breathe, sharpen into crests and crash into drifting foam
- **Background media** — sensory video (with opacity control) and light background music (with volume)
- **Music playlist** — every track (built-in and added) in one visible list: drag the dotted
  handle to reorder (or focus it and press ↑/↓), click a name to jump to it, **×** removes a
  track. **Shuffle** randomizes the order, **Restore removed** brings back removed built-ins,
  and **Repeat** cycles *Off → Playlist → One song → Off*: Off plays through the queue once
  then stops, Playlist wraps around forever, One song loops the current track. Order, repeat
  mode and added files are saved with the rest of your settings
- **Ideas** — **The Ideas Engine**: **Open The Ideas Engine** launches the Google
  Form in a new tab (link set via `SUGGEST_URL` at the top of `app.js`;
  that click needs internet, the app itself never does), and a **Suggest a feature**
  shortcut in the settings footer jumps straight to the tab

## Adding sensory videos and music

These are optional — the built-in **Sensory animation** section covers the basics with no files at
all. When you do want real footage or music:

**A. From the file picker** — Settings → Media:

- **Add video** — works immediately, but is session-only: videos disappear on
  a page refresh and must be re-picked
- **Add music files** — dropped straight into the **Music playlist** (the newest
  one starts playing) and **remembered across reloads**, stored inside the
  browser via IndexedDB. If the browser blocks IndexedDB on `file://` pages,
  they quietly fall back to session-only, exactly like videos

**B. Ship files with the app** — drop files into the `media` folder, then open `media/playlist.js`
and add one line per file:

```js
videos: [
  { name: 'Fish tank', src: 'media/fishtank.mp4' },
],
music: [
  { name: 'Soft rain', src: 'media/rain.mp3' },
]
```

Save, restart the app, and they appear in the Settings dropdowns.

## Built-in sensory music (included)

Five loops ship with the app — all in the same warm-pad style, varying the
instrument color and the chord-change pace. Listed at the top of the music
dropdown:

| Track | File | What it is |
|---|---|---|
| Warm pad (gentle chords) | `media/sensory-warm-pad.wav` | The original — slow F → Bb → C → F, soft attack, warm low notes |
| Warm pad (slow strings) | `media/sensory-strings.wav` | Bowed-string tone with gentle vibrato; chord change every 9 s (the slowest) |
| Warm pad (soft organ) | `media/sensory-organ.wav` | Drawbar-style tone with a slow rotary tremolo; chord change every 6 s (the quickest) |
| Warm pad (felt piano) | `media/sensory-piano.wav` | Soft struck chords ringing as if the sustain pedal is down; change every 8 s |
| Warm pad (breathing pulse) | `media/sensory-pulse.wav` | Pure pad tone with a quiet 69 BPM swell — a sense of tempo, no percussion |

All five are **generated from scratch** by `tools/generate-sensory-sounds.ps1`
(sine waves — math, not recorded or borrowed audio), so they are 100% original
with **no copyright or licensing concerns** for school use. Every loop is
mathematically seamless, so looping (Repeat: *One song* or *Playlist*) never
clicks at the repeat point.
Re-run the script any time to regenerate them (it also recreates this whole
family if tracks are ever lost).

### Why they sound like this — the research

Designed for autistic listeners, weighted toward moderate–severe support needs:

- **Simple music works where complex music doesn't.** Kalas (2012) found *simple*
  music — no syncopation, no chromatic notes, plain I–IV–V chords — supported
  joint attention in **severe** autism, while complex music only helped
  mild/moderate cases. Every track here sticks to the I, IV and V triads of one
  key, in even, predictable change times.
- **Instrumental over vocal.** Autistic adults rated instrumental sounds more
  pleasant than vocal sounds (Michel et al., 2024) — there are no voices here.
- **Warm low frequencies.** Vibroacoustic studies using 30–80 Hz sound reduced
  self-injurious and stereotyped behavior and increased sense of security
  (Lundqvist et al., 2009, RCT); a 2025 pilot of 40 Hz sessions with autistic
  children improved joint attention. Every pad keeps a warm bottom register
  (F2–C3, ~87–131 Hz and below) rather than a thin, bright balance.
- **Predictable and repetitive.** Repetition is calming for sensory-sensitive
  children (Pošols & Remr, 2024), and everything here loops a short, identical
  pattern rather than developing.
- **Nothing sudden or bright.** Autistic listeners show reduced habituation to
  sounds — annoyance doesn't fade — and loud, sudden, high-pitched or unpredictable
  sounds are the most distressing (Dwyer et al., 2025; Frontiers 2026 review).
  Every track uses slow attacks, steady dynamics, a peak of only 50% of full
  scale, and gentle harmonic balance (no harsh top end).

Start quiet: the app's default music volume is 30%.

## Sensory design notes

Built on established visual-timer practice for autistic users:

- **Time made visible** — the filling disk shows *how much* and *when*, the way a
  Time Timer's shrinking red disk does, so "5 minutes" becomes something concrete
- **Silent by default is possible** — every sound and the flash can be turned off;
  the timer works fully in silence with visual-only cues
- **Gentle, not startling** — sounds are soft two-tone chimes (not beeps/buzzers),
  the flash is a slow pulse, and warnings are calm banners
- **Predictable wording** — every ending says exactly what happens next
  ("Work is finished! Earn is next."), and nothing switches without the user seeing why
- **User-controlled pace** — the default is to *pause* at the end and wait for a
  deliberate Start, so the person using it is never rushed into a transition
- **Adjustable, not fixed** — durations, warning points, theme, text size,
  layout, and how lively the sensory animation moves (Off / Gentle /
  Noticeable) all adapt to the individual rather than the other way round

## School / IT notes

- Pure static HTML/CSS/JS — no installer, no executable, no admin rights
- No network calls of any kind (no CDNs, no fonts, no telemetry) — works fully offline
- Settings live in the browser's `localStorage` on that machine only
- If your IT browser blocks `localStorage`, the app still runs — settings just
  won't remember between launches

## Files

```
index.html        home — chooser (Tools / Resources)
tools.html        tools hub (timer + Ideas Engine cards)
resources.html    resources hub (six staff-resource cards)
timer.html        the app — page structure
styles.css        themes, layout, animations (app)
site.css          shared styling + print styles (site pages)
app.js            timer engine, settings, sound, media
quick-start.html  staff resource pages (also: user-guide, settings-ref,
user-guide.html   troubleshooting, scenarios, glossary)
media/            sensory music (5 built-in loops) + drop extra videos/music here
media/playlist.js media list the app reads
tools/            script that generates the built-in loops
README.md         this file
```
