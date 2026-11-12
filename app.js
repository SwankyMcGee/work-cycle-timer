/* ============================================================
   Work Cycle Timer — app logic
   Cycle: Work <-> Earn, two semi-circle dials that fill as
   time progresses. States: ready -> running <-> paused ->
   finished -> (pause for Start | automatic switch).
   ============================================================ */

'use strict';

/* ---------- Defaults & persistence (settings only) ---------- */

const DEFAULTS = {
  title: 'Work Cycle Timer',
  workMinutes: 10, workSeconds: 0,
  earnMinutes: 5, earnSeconds: 0,
  workCycles: 1,                 // work cycles that must finish before Earn
  endBehavior: 'pause',          // 'pause' | 'auto' | 'auto10'
  warningsOn: true, warn120: false, warn60: true, warn30: true,
  soundOn: true, soundVol: 50, soundType: 'chime',
  flashOn: true,
  largeText: false, theme: 'calm', layout: 'side',
  anim: 'none', animOpacity: 50,
  animReact: 'gentle',         // 'off' | 'gentle' | 'noticeable' — physics in bubbles/waves
  bgVideo: '', videoOpacity: 25,
  bgMusic: '', musicVol: 30,
  playlistOrder: [],             // track keys in queue order
  playlistHidden: [],            // track keys removed from the queue
  repeatMode: 'off'              // 'off' | 'all' | 'one'
};

const STORAGE_KEY = 'workCycleTimer.settings.v1';

/* Color palettes offered in Settings → Display. chips = [page background,
   card, text, accent/work dial, earn dial] — keep in step with the
   matching body[data-theme] block in styles.css. */
const THEMES = [
  { id: 'calm',     name: 'Calm (soft blue & green)',   chips: ['#f2f6f8', '#ffffff', '#33414d', '#4d84a6', '#628f5d'] },
  { id: 'lavender', name: 'Lavender (soft purple)',     chips: ['#f5f3fb', '#ffffff', '#3d3a52', '#7a6fc0', '#6a9a76'] },
  { id: 'mint',     name: 'Mint (fresh green)',         chips: ['#eef8f3', '#ffffff', '#2f4640', '#35837e', '#6f9a58'] },
  { id: 'peach',    name: 'Peach (warm apricot)',       chips: ['#fdf6ef', '#fffdfb', '#4d3f34', '#c26a3c', '#7a9a5a'] },
  { id: 'rose',     name: 'Rose (soft pink)',           chips: ['#fdf4f6', '#ffffff', '#4f3540', '#c25f7e', '#6f9466'] },
  { id: 'ocean',    name: 'Ocean (aqua blue)',          chips: ['#eef8fa', '#ffffff', '#2c4750', '#2f87a3', '#5f9a6a'] },
  { id: 'low',      name: 'Low contrast (very gentle)', chips: ['#eef1f3', '#f6f8f9', '#5b6570', '#94b4c3', '#a9c5a5'] },
  { id: 'high',     name: 'High contrast',              chips: ['#000000', '#0b0d10', '#ffffff', '#56e0ff', '#b7ff5e'] },
  { id: 'dark',     name: 'Dark (slate)',               chips: ['#151a20', '#1e242b', '#e7edf2', '#6fa9c7', '#8fbf88'] },
  { id: 'midnight', name: 'Midnight (deep blue)',       chips: ['#0a0f1e', '#121a30', '#e3e9f7', '#6fa8ff', '#67d6a5'] },
  { id: 'warm',     name: 'Warm dark (sepia)',          chips: ['#211a14', '#2b221a', '#f0e6da', '#d9a05f', '#93b877'] }
];

function loadSettings() {
  let s = Object.assign({}, DEFAULTS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) s = Object.assign(s, JSON.parse(raw));
  } catch (err) { /* storage blocked or corrupt — use defaults */ }
  // Session-only blob URLs are dead after a reload
  if (typeof s.bgVideo === 'string' && s.bgVideo.indexOf('blob:') === 0) s.bgVideo = '';
  if (typeof s.bgMusic === 'string' && s.bgMusic.indexOf('blob:') === 0) s.bgMusic = '';
  // Retired animations fall back to none
  const validAnims = ['none', 'bubbles', 'glow', 'waves', 'rain'];
  if (validAnims.indexOf(s.anim) === -1) s.anim = 'none';
  // Animation reactivity: off | gentle | noticeable
  if (s.animReact !== 'off' && s.animReact !== 'gentle' && s.animReact !== 'noticeable') {
    s.animReact = DEFAULTS.animReact;
  }
  // Color theme: only known palettes (hand-edited storage can't break styling)
  if (!THEMES.some((t) => t.id === s.theme)) s.theme = DEFAULTS.theme;
  // Title: plain text, trimmed, sane length
  if (typeof s.title !== 'string') {
    s.title = DEFAULTS.title;
  } else {
    s.title = s.title.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!s.title) s.title = DEFAULTS.title;
  }
  // Work cycles per earn: whole number 1-10
  s.workCycles = Math.round(Number(s.workCycles));
  if (!isFinite(s.workCycles)) s.workCycles = DEFAULTS.workCycles;
  s.workCycles = clamp(s.workCycles, 1, 10);
  // Playlist: arrays of track keys, repeat off | all | one
  s.playlistOrder = Array.isArray(s.playlistOrder)
    ? s.playlistOrder.filter((k) => typeof k === 'string').slice(0, 500) : [];
  s.playlistHidden = Array.isArray(s.playlistHidden)
    ? s.playlistHidden.filter((k) => typeof k === 'string').slice(0, 500) : [];
  if (s.repeatMode !== 'all' && s.repeatMode !== 'one') s.repeatMode = 'off';
  if (typeof s.bgMusic !== 'string') s.bgMusic = '';
  return s;
}

function saveSettings() {
  const copy = Object.assign({}, settings);
  if (typeof copy.bgVideo === 'string' && copy.bgVideo.indexOf('blob:') === 0) copy.bgVideo = '';
  if (typeof copy.bgMusic === 'string' && copy.bgMusic.indexOf('blob:') === 0) copy.bgMusic = '';
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(copy)); } catch (err) {}
}

const settings = loadSettings();

/* ---------- Runtime state ---------- */

let mode = 'work';               // 'work' | 'earn'
let workDone = 0;                // work cycles completed since the last Earn
let phase = 'ready';             // 'ready' | 'running' | 'paused' | 'finished' | 'switching'
let endAt = 0;                   // timestamp when the running timer ends
let remainingMs = 0;             // ms left in the current cycle
let switchCountdown = 0;         // seconds left in 'auto10' mode
let autoTimer = null;            // timeout handle for 'auto' switching
let countdownTimer = null;       // interval handle for 'auto10' switching
const warned = new Set();        // warning thresholds already shown this cycle
let cycleBadgeKey = null;        // last "current/total" shown in the work-card badge

const $ = (id) => document.getElementById(id);

const fullMs = (m) => (m === 'work'
  ? settings.workMinutes * 60 + settings.workSeconds
  : settings.earnMinutes * 60 + settings.earnSeconds) * 1000;

const otherMode = (m) => (m === 'work' ? 'earn' : 'work');
const modeName = (m) => (m === 'work' ? 'Work' : 'Earn');

const workCyclesTarget = () =>
  clamp(Math.round(Number(settings.workCycles) || 1), 1, 10);

/* The mode that starts when the current cycle ends.
   workDone is only counted inside advanceCycle(), so during a cycle
   the current one is workDone + 1 — hence the +1 prediction here. */
function nextMode() {
  if (mode === 'earn') return 'work';
  return (workDone + 1) >= workCyclesTarget() ? 'earn' : 'work';
}

/* Short human label for what comes next, e.g. "Work cycle 2 of 3". */
function nextLabel() {
  const n = nextMode();
  if (n === 'earn') return 'Earn';
  const target = workCyclesTarget();
  if (target <= 1) return 'Work';
  const num = mode === 'work' ? workDone + 2 : 1;
  return 'Work cycle ' + Math.min(num, target) + ' of ' + target;
}

/* Banner text when a cycle finishes.
   Keeps the classic wording when the target is 1 (the default). */
function finishBannerText() {
  const target = workCyclesTarget();
  const current = (mode === 'work' && target > 1)
    ? 'Work cycle ' + (workDone + 1) + ' of ' + target
    : modeName(mode);
  return current + ' is finished! ' + nextLabel() + ' is next.';
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

function fmt(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function parseNum(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return clamp(n, min, max);
}

/* ---------- DOM references ---------- */

const cards = {
  work: document.querySelector('.timer-card[data-mode="work"]'),
  earn: document.querySelector('.timer-card[data-mode="earn"]')
};

const bannerEl = $('banner');
const mainBtn = $('mainBtn');
const cycleLine = $('cycleLine');
const gearBtn = $('gearBtn');
const settingsModal = $('settingsModal');
const bgVideo = $('bgVideo');
const bgMusic = $('bgMusic');
const animCanvas = $('animCanvas');
const actx = animCanvas.getContext('2d');

/* ---------- Semi-circle dial ----------
   The wedge grows clockwise from 12 o'clock as time passes,
   so at half elapsed it looks exactly like a semi-circle.
   The remaining (empty) time cuts the fill off.            */

function wedgePath(progress) {
  const p = clamp(progress, 0, 1);
  if (p <= 0) return '';
  const cx = 50, cy = 50, r = 46;
  if (p >= 1) {
    return 'M 50 4 A 46 46 0 1 1 50 96 A 46 46 0 1 1 50 4 Z';
  }
  const angle = p * Math.PI * 2;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const largeArc = p > 0.5 ? 1 : 0;
  return 'M 50 50 L 50 4 A 46 46 0 ' + largeArc + ' 1 ' +
         x.toFixed(3) + ' ' + y.toFixed(3) + ' Z';
}

function setCard(m, opts) {
  const card = cards[m];
  card.classList.toggle('is-active', opts.active);
  const progress = opts.full > 0 ? 1 - opts.remaining / opts.full : 0;
  card.querySelector('.dial-wedge').setAttribute('d', wedgePath(progress));
  card.querySelector('.time-display').textContent = fmt(opts.remaining);
  card.querySelector('.timer-status').textContent = opts.status;
  card.querySelector('.timer-total').textContent = 'of ' + fmt(opts.full);
}

function statusText() {
  if (phase === 'running') return 'Running';
  if (phase === 'paused') return 'Paused';
  if (phase === 'ready') return 'Ready';
  return "Time's up";
}

function render() {
  const full = fullMs(mode);
  const done = phase === 'finished' || phase === 'switching';
  const remaining = phase === 'ready' ? full : (done ? 0 : remainingMs);

  setCard(mode, { active: true, remaining: remaining, full: full, status: statusText() });

  const nm = otherMode(mode);
  setCard(nm, { active: false, remaining: fullMs(nm), full: fullMs(nm), status: 'Waiting' });

  document.body.dataset.current = mode;

  // "Cycle 2 of 3" badge on the Work card — only in multi-work mode
  const badgeTarget = workCyclesTarget();
  const badgeKey = (badgeTarget > 1 && mode === 'work')
    ? Math.min(workDone + 1, badgeTarget) + '/' + badgeTarget
    : '';
  if (badgeKey !== cycleBadgeKey) {
    cycleBadgeKey = badgeKey;
    const badge = $('cycleBadge');
    badge.hidden = !badgeKey;
    if (badgeKey) {
      const cur = Math.min(workDone + 1, badgeTarget);
      $('cycleText').textContent = 'Cycle ' + cur + ' of ' + badgeTarget;
      let pips = '';
      for (let i = 1; i <= badgeTarget; i++) {
        pips += '<span class="pip ' +
          (i < cur ? 'done' : i === cur ? 'now' : 'todo') + '"></span>';
      }
      $('cyclePips').innerHTML = pips;
    }
  }

  const next = nextMode();   // sequence-aware: may be this same mode again
  if (phase === 'running') {
    $('mainLabel').textContent = 'Pause';
  } else if (phase === 'paused') {
    $('mainLabel').textContent = 'Resume';
  } else if (phase === 'ready') {
    $('mainLabel').textContent = 'Start ' + modeName(mode);
  } else {
    $('mainLabel').textContent = 'Start ' + modeName(next) + (phase === 'switching' ? ' now' : '');
  }

  if (phase === 'switching') {
    cycleLine.textContent = 'Starting ' + modeName(next) + ' in ' + switchCountdown + '…';
  } else {
    cycleLine.textContent = 'Work ' + fmt(fullMs('work')) +
      ' · Earn ' + fmt(fullMs('earn')) +
      ' · Next up: ' + nextLabel();
  }
}

/* ---------- Banner ---------- */

let bannerTimer = null;

function showBanner(text, ms) {
  bannerEl.textContent = text;
  bannerEl.classList.add('show');
  clearTimeout(bannerTimer);
  if (ms) bannerTimer = setTimeout(hideBanner, ms);
}

function hideBanner() {
  bannerEl.classList.remove('show');
  bannerEl.textContent = '';
  clearTimeout(bannerTimer);
}

/* ---------- Sound (Web Audio — no files needed) ---------- */

let audioCtx = null;

function ensureAudio() {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) audioCtx = new Ctor();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) { audioCtx = null; }
  return audioCtx;
}

function tone(freq, at, dur, vol, type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), at + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function playSound(kind) {
  if (!settings.soundOn) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const vol = (settings.soundVol / 100) * (kind === 'warning' ? 0.3 : 0.55);
  if (vol <= 0) return;
  const t = ctx.currentTime + 0.02;
  switch (settings.soundType) {
    case 'bell':
      tone(659.25, t, 1.8, vol, 'triangle');
      tone(987.77, t + 0.1, 1.5, vol * 0.5, 'triangle');
      break;
    case 'ping':
      tone(783.99, t, 1.0, vol, 'sine');
      break;
    default: // soft chime
      tone(659.25, t, 1.2, vol, 'sine');
      tone(880, t + 0.2, 1.4, vol * 0.8, 'sine');
  }
}

/* ---------- End-of-cycle flash ---------- */

function flash() {
  if (!settings.flashOn) return;
  document.body.classList.remove('flash-active');
  void document.body.offsetWidth; // restart the animation
  document.body.classList.add('flash-active');
  setTimeout(() => document.body.classList.remove('flash-active'), 2400);
}

/* ---------- Preloaded sensory animations ----------
   Slow, gentle canvas animations behind the timers so the
   app is calming out of the box — no video files needed.  */

let animPalette = ['#4d84a6', '#628f5d', '#4d84a6'];
let animBubbles = [];
let animRain = [];
let animSplash = [];
let animWaves = [];
let animGlow = [];
let animPops = [];      // rings left behind when a bubble bursts
let animFoam = [];      // spray thrown up when a wave crashes
let animFoamTint = [];  // lighter palette twin so foam reads on any theme
let animKind = '';      // last animation drawn — clears stray particles on switch
let animRaf = null;
let animLast = 0;

/* How lively the physics run: 0 = plain drift, 1 = gentle, 2 = noticeable.
   Read fresh every frame, so the setting applies without a restart. */
function reactLevel() {
  if (settings.animReact === 'noticeable') return 2;
  if (settings.animReact === 'gentle') return 1;
  return 0;
}

function parseHex(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return Number.isNaN(n) ? null : { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToRgba(hex, a) {
  const c = parseHex(hex);
  if (!c) return 'rgba(120, 140, 160, ' + a + ')';
  return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + a + ')';
}

function rgbToHsl(c) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}

function shiftColor(hex, dh, ds, dl) {
  const c = parseHex(hex);
  if (!c) return hex;
  const hsl = rgbToHsl(c);
  return hslToHex(hsl.h + dh, hsl.s + ds, hsl.l + dl);
}

/* Builds a family of 9 harmonious variants (3 per theme base color)
   so every particle can have its own shade without leaving the theme. */
function readAnimPalette() {
  const cs = getComputedStyle(document.body);
  const bases = [
    cs.getPropertyValue('--work').trim() || '#4d84a6',
    cs.getPropertyValue('--earn').trim() || '#628f5d',
    cs.getPropertyValue('--accent').trim() || '#4d84a6'
  ];
  const shifts = [
    [14, 5, 11], [-18, -7, 13],
    [-12, 7, 10], [20, -5, 12],
    [24, -9, 14], [-22, 6, 9]
  ];
  animPalette = [];
  bases.forEach((hex, i) => {
    animPalette.push(hex);
    animPalette.push(shiftColor(hex, shifts[i * 2][0], shifts[i * 2][1], shifts[i * 2][2]));
    animPalette.push(shiftColor(hex, shifts[i * 2 + 1][0], shifts[i * 2 + 1][1], shifts[i * 2 + 1][2]));
  });
  // Foam = the wave color lifted lighter, so spray reads on light and dark themes
  animFoamTint = animPalette.map((hex) => shiftColor(hex, 8, -34, 26));
}

const animColorIndex = () => Math.floor(Math.random() * animPalette.length);

function resizeAnimCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  animCanvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
  animCanvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  actx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initAnimEntities() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  animBubbles = [];
  animRain = [];
  animSplash = [];
  animWaves = [];
  animGlow = [];
  animPops = [];
  animFoam = [];

  // More bubbles at the livelier level — bumping needs neighbours to hit
  const bubbleCount = reactLevel() === 2 ? 30 : 24;
  for (let i = 0; i < bubbleCount; i++) {
    animBubbles.push({
      x: Math.random() * w,               // physics position (collisions act here)
      y: Math.random() * h,
      r: 4 + Math.random() * 30,           // 4-34px — wide size spread
      vy: -(8 + Math.random() * 34),       // 8-42 px/s upward (never zooms)
      vx: 0,                               // sideways speed — only collisions change it
      drift: 6 + Math.random() * 40,       // 6-46px sway, added on top at draw time
      phase: Math.random() * Math.PI * 2,
      alpha: 0.08 + Math.random() * 0.26,
      color: animColorIndex(),
      popped: false
    });
  }

  for (let i = 0; i < 72; i++) {
    animRain.push({
      x: Math.random() * (w + 120) - 60,
      y: Math.random() * h,
      len: 8 + Math.random() * 14,         // 8-22px base streak
      vy: 30 + Math.random() * 60,         // starting fall speed
      vyMax: 230 + Math.random() * 90,     // terminal speed — never zooms
      g: 180 + Math.random() * 160,        // gravity (varies per drop)
      wind: 3 + Math.random() * 11,        // gentle sideways drift
      alpha: 0.08 + Math.random() * 0.22,
      color: animColorIndex()
    });
  }

  for (let i = 0; i < 3; i++) {
    animWaves.push({
      color: animColorIndex(),
      alpha: 0.08 + Math.random() * 0.10,
      amp: 14 + Math.random() * 22,        // 14-36px height
      len: 520 + Math.random() * 580,      // 520-1100px wavelength
      speed: (7 + Math.random() * 13) * (Math.random() < 0.5 ? -1 : 1),
      y: h - 64 + i * 26 + Math.random() * 8,
      h2: Math.random() * Math.PI * 2,        // shape offsets — no two swells match
      h3: Math.random() * Math.PI * 2,
      swellRate: 0.22 + Math.random() * 0.3,  // amplitude breathes slowly
      swellPhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,  // whole surface bobs slowly
      nextCrash: Math.random() * 3            // stagger the first crash
    });
  }

  const glowCount = 2 + (Math.random() < 0.5 ? 1 : 0);   // 2 or 3 blobs
  for (let i = 0; i < glowCount; i++) {
    animGlow.push({
      fx: 0.18 + Math.random() * 0.64,     // base position (fraction of screen)
      fy: 0.20 + Math.random() * 0.60,
      ax: 0.04 + Math.random() * 0.06,     // horizontal drift range
      ay: 0.05 + Math.random() * 0.07,
      rf: 0.26 + Math.random() * 0.20,     // radius (fraction of min screen side)
      speed: 0.04 + Math.random() * 0.05,  // path speed
      breath: 0.35 + Math.random() * 0.30, // breathing rate
      phase: Math.random() * Math.PI * 2,
      a: 0.13 + Math.random() * 0.10,
      color: animColorIndex()
    });
  }
}

function drawBubbles(t, dt, w, h) {
  const rl = reactLevel();

  // Rise and wrap. The sway itself is added at draw time (exactly like the
  // original), so it can never drift or grow on its own — physics only
  // ever touches vx/vy.
  for (const b of animBubbles) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -b.r - 10) {
      b.y = h + b.r + 10 + Math.random() * h * 0.2;
      b.x = Math.random() * w;
      b.vx = 0;
    }
    if (b.x < -b.r - 60) b.x = w + b.r + 60;
    else if (b.x > w + b.r + 60) b.x = -b.r - 60;
  }

  if (rl > 0) collideBubbles(t, w, h, rl);

  for (const b of animBubbles) {
    const x = b.x + Math.sin(t * 0.5 + b.phase) * b.drift;
    actx.beginPath();
    actx.arc(x, b.y, b.r, 0, Math.PI * 2);
    actx.fillStyle = hexToRgba(animPalette[b.color], b.alpha);
    actx.fill();
  }

  // Pop rings: one soft burst where a bubble let go, then gone
  for (let i = animPops.length - 1; i >= 0; i--) {
    const p = animPops[i];
    p.t += dt;
    const k = p.t / 0.55;
    if (k >= 1) { animPops.splice(i, 1); continue; }
    actx.beginPath();
    actx.arc(p.x, p.y, p.r * (0.7 + k * 1.15), 0, Math.PI * 2);
    actx.strokeStyle = hexToRgba(animPalette[p.color], (1 - k) * 0.55);
    actx.lineWidth = 2;
    actx.stroke();
  }
}

/* Gentle bubble-bubble collisions: they ease apart, trade momentum along
   the contact normal (heavier = bigger), and a hard enough knock pops the
   smaller, more fragile one. Everything is clamped so nothing ever sinks
   or rockets away — this stays a calm animation, not a pinball table. */
function collideBubbles(t, w, h, rl) {
  const e = rl === 2 ? 0.75 : 0.5;     // bounciness
  const popAt = rl === 2 ? 30 : 40;    // impact (px/s) needed to pop
  const n = animBubbles.length;
  const rx = new Array(n);             // rendered x (physics x + sway)
  const rvx = new Array(n);            // rendered horizontal velocity
  for (let i = 0; i < n; i++) {
    const b = animBubbles[i];
    rx[i] = b.x + Math.sin(t * 0.5 + b.phase) * b.drift;
    rvx[i] = b.vx + Math.cos(t * 0.5 + b.phase) * b.drift * 0.5;
  }

  for (let i = 0; i < n; i++) {
    const a = animBubbles[i];
    if (a.popped) continue;
    for (let j = i + 1; j < n; j++) {
      const c = animBubbles[j];
      if (c.popped) continue;
      const dx = rx[j] - rx[i];
      const dy = c.y - a.y;
      const rr = a.r + c.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2);
      if (d < 0.001) {                 // perfectly stacked — nudge apart
        a.x -= 0.5; c.x += 0.5;
        rx[i] -= 0.5; rx[j] += 0.5;
        continue;
      }
      const nx = dx / d, ny = dy / d;
      // ease apart so they never sit inside each other
      const push = (rr - d) * 0.5;
      a.x -= nx * push; a.y -= ny * push;
      c.x += nx * push; c.y += ny * push;
      rx[i] -= nx * push; rx[j] += nx * push;

      const along = (rvx[j] - rvx[i]) * nx + (c.vy - a.vy) * ny;
      if (along < 0) {                 // only when moving together
        const ma = a.r * a.r, mc = c.r * c.r;
        const imp = -(1 + e) * along / (1 / ma + 1 / mc);
        a.vx -= (imp * nx) / ma; a.vy -= (imp * ny) / ma;
        c.vx += (imp * nx) / mc; c.vy += (imp * ny) / mc;
        rvx[i] -= (imp * nx) / ma;
        rvx[j] += (imp * nx) / mc;
        // keep it calm — nobody sinks, nobody rockets
        a.vy = Math.max(-55, Math.min(-4, a.vy));
        c.vy = Math.max(-55, Math.min(-4, c.vy));
        a.vx = Math.max(-34, Math.min(34, a.vx));
        c.vx = Math.max(-34, Math.min(34, c.vx));
        if (-along > popAt) (a.r <= c.r ? a : c).popped = true;
      }
    }
  }

  // turn pops into rings, then fresh bubbles rising from below
  for (const b of animBubbles) {
    if (!b.popped) continue;
    b.popped = false;
    animPops.push({
      x: b.x + Math.sin(t * 0.5 + b.phase) * b.drift,
      y: b.y, r: b.r, t: 0, color: b.color
    });
    b.y = h + b.r + 10 + Math.random() * h * 0.25;
    b.x = Math.random() * w;
    b.vx = 0;
    b.vy = -(8 + Math.random() * 34);
    b.r = 4 + Math.random() * 30;
    b.color = animColorIndex();
    b.alpha = 0.08 + Math.random() * 0.26;
    b.drift = 6 + Math.random() * 40;
    b.phase = Math.random() * Math.PI * 2;
  }
}

function drawGlow(t, w, h) {
  const minDim = Math.min(w, h);
  for (const bl of animGlow) {
    const cx = w * bl.fx + Math.sin(t * bl.speed + bl.phase) * w * bl.ax;
    const cy = h * bl.fy + Math.cos(t * bl.speed * 0.8 + bl.phase) * h * bl.ay;
    const breath = 0.85 + 0.15 * Math.sin(t * bl.breath + bl.phase);
    const r = minDim * bl.rf * breath;
    const g = actx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, hexToRgba(animPalette[bl.color], bl.a));
    g.addColorStop(1, hexToRgba(animPalette[bl.color], 0));
    actx.fillStyle = g;
    actx.beginPath();
    actx.arc(cx, cy, r, 0, Math.PI * 2);
    actx.fill();
  }
}

/* A crash: a handful of foam droplets thrown off the crest, drifting the
   way the swell travels and falling back under gravity. */
function spawnFoam(x, y, L, rl) {
  const n = rl === 2 ? 7 + Math.floor(Math.random() * 6) : 4 + Math.floor(Math.random() * 4);
  const dir = L.speed >= 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    if (animFoam.length > 90) animFoam.shift();
    animFoam.push({
      x: x + (Math.random() - 0.5) * 26,
      y: y - Math.random() * 4,
      vx: dir * (16 + Math.random() * 54) + (Math.random() - 0.5) * 20,
      vy: -(34 + Math.random() * (rl === 2 ? 76 : 50)),
      r: 1.4 + Math.random() * 2.2,
      t: 0,
      life: 0.8 + Math.random() * 0.7,
      color: L.color
    });
  }
}

function drawWaves(t, dt, w, h) {
  const rl = reactLevel();
  const step = 12;
  for (const L of animWaves) {
    // swell: amplitude breathes, the whole surface bobs — slowly, gently
    const swell = rl > 0 ? 1 + 0.28 * Math.sin(t * L.swellRate + L.swellPhase) : 1;
    const bob = rl > 0 ? Math.sin(t * 0.12 + L.bobPhase) * 4 : 0;
    const baseY = L.y + bob;
    const speedT = (L.speed / L.len) * Math.PI * 2;
    const xs = [];
    const ys = [];
    for (let x = 0; x <= w + step; x += step) {
      const w1 = (x / L.len) * Math.PI * 2 + t * speedT;
      let s;
      if (rl > 0) {
        // three combined swells; crests sharpen, troughs flatten — real water
        s = Math.sin(w1) * 0.74
          + Math.sin(w1 * 2.07 + L.h2) * 0.17
          + Math.sin(w1 * 0.43 + t * 0.13 + L.h3) * 0.09;
        if (s > 0) s = Math.pow(s, 0.72);
      } else {
        s = Math.sin(w1);              // Off: the original plain wave
      }
      xs.push(x);
      ys.push(baseY + s * L.amp * swell);
    }

    actx.beginPath();
    actx.moveTo(0, h);
    for (let i = 0; i < xs.length; i++) actx.lineTo(xs[i], ys[i]);
    actx.lineTo(w, h);
    actx.closePath();
    actx.fillStyle = hexToRgba(animPalette[L.color], L.alpha);
    actx.fill();

    // Crash time: tallest crest in view throws spray, at its own rhythm
    if (rl > 0 && t >= L.nextCrash) {
      let bestI = -1;
      let bestQ = 0;
      const range = L.amp * swell || 1;
      for (let i = 2; i < ys.length - 2; i++) {
        if (ys[i] < ys[i - 1] && ys[i] <= ys[i + 1]) {   // a peak (screen y up)
          const q = (baseY - ys[i]) / range;
          if (q > bestQ) { bestQ = q; bestI = i; }
        }
      }
      if (bestI >= 0 && bestQ > 0.55 && Math.random() < (rl === 2 ? 0.8 : 0.55)) {
        spawnFoam(xs[bestI], ys[bestI], L, rl);
        L.nextCrash = t + (rl === 2 ? 0.8 + Math.random() * 1.2 : 1.8 + Math.random() * 2.6);
      } else {
        L.nextCrash = t + 0.55;        // no good crest yet — look again shortly
      }
    }
  }

  // Foam spray, drawn over the water
  for (let i = animFoam.length - 1; i >= 0; i--) {
    const f = animFoam[i];
    f.t += dt;
    f.vy += 260 * dt;                  // what goes up falls back down
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    const k = f.t / f.life;
    if (k >= 1 || f.y > h + 12) { animFoam.splice(i, 1); continue; }
    actx.beginPath();
    actx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    actx.fillStyle = hexToRgba(animFoamTint[f.color] || animPalette[f.color], (1 - k) * 0.4);
    actx.fill();
  }
}

function drawRain(dt, w, h) {
  const floorY = h - 8;

  // subtle ground line for the drops to land on
  actx.beginPath();
  actx.moveTo(0, floorY + 1);
  actx.lineTo(w, floorY + 1);
  actx.strokeStyle = hexToRgba(animPalette[0], 0.16);
  actx.lineWidth = 2;
  actx.stroke();

  actx.lineWidth = 1.4;
  actx.lineCap = 'round';
  for (const d of animRain) {
    // gravity: each drop accelerates until its terminal speed
    d.vy = Math.min(d.vyMax, d.vy + d.g * dt);
    d.y += d.vy * dt;
    d.x += d.wind * dt;

    if (d.y >= floorY) {
      // splash on the floor, then fall again from the top
      if (animSplash.length > 48) animSplash.shift();
      animSplash.push({
        x: d.x, y: floorY, t: 0,
        alpha: Math.min(0.3, d.alpha + 0.08),
        color: d.color
      });
      d.y = -d.len - Math.random() * h * 0.25;
      d.x = Math.random() * (w + 120) - 60;
      d.vy = 30 + Math.random() * 50;
    }

    const drawLen = d.len + d.vy * 0.03;   // streaks stretch as they speed up
    actx.beginPath();
    actx.moveTo(d.x, d.y);
    actx.lineTo(d.x - d.wind * 0.9, d.y - drawLen);
    actx.strokeStyle = hexToRgba(animPalette[d.color], d.alpha);
    actx.stroke();
  }

  // splashes: little arcs blooming on the floor
  for (let i = animSplash.length - 1; i >= 0; i--) {
    const s = animSplash[i];
    s.t += dt;
    const p = s.t / 0.45;
    if (p >= 1) { animSplash.splice(i, 1); continue; }
    actx.beginPath();
    actx.arc(s.x, s.y, 2 + p * 9, Math.PI * 1.05, Math.PI * 1.95);
    actx.strokeStyle = hexToRgba(animPalette[s.color], (1 - p) * s.alpha);
    actx.lineWidth = 1.3;
    actx.stroke();
  }
}

function drawAnim(now) {
  animRaf = requestAnimationFrame(drawAnim);
  const dt = Math.min(0.05, Math.max(0.001, (now - animLast) / 1000));
  animLast = now;
  const t = now / 1000;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (animKind !== settings.anim) {   // switched types — drop stray particles
    animKind = settings.anim;
    animPops.length = 0;
    animFoam.length = 0;
  }
  actx.clearRect(0, 0, w, h);
  if (settings.anim === 'bubbles') drawBubbles(t, dt, w, h);
  else if (settings.anim === 'glow') drawGlow(t, w, h);
  else if (settings.anim === 'waves') drawWaves(t, dt, w, h);
  else if (settings.anim === 'rain') drawRain(dt, w, h);
}

function updateAnim() {
  const on = settings.anim && settings.anim !== 'none';
  if (on) {
    readAnimPalette();
    if (!animRaf) {
      resizeAnimCanvas();
      initAnimEntities();
      animLast = performance.now();
      animRaf = requestAnimationFrame(drawAnim);
    }
  } else if (animRaf) {
    cancelAnimationFrame(animRaf);
    animRaf = null;
    actx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

window.addEventListener('resize', () => {
  if (animRaf) resizeAnimCanvas();
});

/* ---------- Cycle engine ---------- */

function ensureSwitchTimersCleared() {
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function begin() {
  ensureAudio();
  endAt = Date.now() + remainingMs;
  phase = 'running';
  hideBanner();
  render();
}

/* Count the cycle that just ended and move to the next one in the
   sequence: work ×N, then Earn, then work ×N, ... Skip uses this too,
   so skipping advances the sequence instead of flipping modes. */
function advanceCycle() {
  ensureSwitchTimersCleared();
  if (mode === 'work') {
    workDone++;
    if (workDone >= workCyclesTarget()) {
      workDone = 0;
      mode = 'earn';
    }
    // else: another work cycle is next — mode stays 'work'
  } else {
    mode = 'work';
  }
  remainingMs = fullMs(mode);
  warned.clear();
  hideBanner();
  phase = 'ready';
}

function changeMode(autoStart) {
  advanceCycle();
  if (autoStart) begin();
  else render();
}

function finish() {
  ensureSwitchTimersCleared();
  remainingMs = 0;
  phase = 'finished';
  render();
  playSound('transition');
  flash();
  showBanner(finishBannerText(), 0);

  if (settings.endBehavior === 'auto') {
    autoTimer = setTimeout(() => { autoTimer = null; changeMode(true); }, 1500);
  } else if (settings.endBehavior === 'auto10') {
    phase = 'switching';
    switchCountdown = 10;
    render();
    countdownTimer = setInterval(() => {
      switchCountdown--;
      if (switchCountdown <= 0) changeMode(true);
      else render();
    }, 1000);
  }
}

function onMain() {
  if (phase === 'running') {
    remainingMs = Math.max(0, endAt - Date.now());
    phase = 'paused';
    render();
    return;
  }
  if (phase === 'finished' || phase === 'switching') {
    // Advance to the next cycle in the sequence, cancelling any pending auto-switch
    changeMode(true);
    return;
  }
  begin(); // ready or paused
}

function onReset() {
  ensureSwitchTimersCleared();
  workDone = 0;   // progress toward the Earn starts over too
  remainingMs = fullMs(mode);
  warned.clear();
  phase = 'ready';
  hideBanner();
  render();
}

function onSkip() {
  advanceCycle();   // ends this cycle, starts whatever comes next in the sequence
  render();
  showBanner(modeName(mode) + ' is ready to start.', 4000);
}

/* ---------- Warnings ---------- */

function warningText(t) {
  if (t >= 60) {
    const mins = t / 60;
    return mins + ' minute' + (mins > 1 ? 's' : '') + ' left';
  }
  return t + ' seconds left';
}

function checkWarnings() {
  if (!settings.warningsOn) return;
  const fullSec = Math.round(fullMs(mode) / 1000);
  const remainingSec = Math.ceil(remainingMs / 1000);
  for (const t of [120, 60, 30]) {
    if (!settings['warn' + t] || warned.has(t)) continue;
    if (t >= fullSec) continue;            // never warn at the very start
    if (remainingSec <= t) {
      warned.add(t);
      showBanner(warningText(t), 4500);
      playSound('warning');
    }
  }
}

/* ---------- Tick ---------- */

function tick() {
  if (phase !== 'running') return;
  remainingMs = endAt - Date.now();
  if (remainingMs <= 0) {
    remainingMs = 0;
    finish();
    return;
  }
  checkWarnings();
  render();
}

/* ---------- Hold-to-activate (kid-safe buttons) ----------
   Every sensitive control requires a continuous press for
   `ms` milliseconds. Releasing early does nothing. Works with
   mouse, touch and keyboard (Enter / Space held down).       */

function makeHoldable(el, ms, action) {
  let timeout = null;
  let busy = false;   // stays true after firing until release, so a
                      // held key's auto-repeat can't re-fire the action

  function start(e) {
    if (busy) return;
    if (e.type === 'pointerdown' && typeof e.button === 'number' && e.button !== 0) return;
    busy = true;
    el.classList.add('holding');
    timeout = setTimeout(() => {
      timeout = null;
      el.classList.remove('holding');
      action();
    }, ms);
  }

  function cancel() {
    if (timeout) { clearTimeout(timeout); timeout = null; }
    busy = false;
    el.classList.remove('holding');
  }

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('blur', cancel);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(e); }
  });
  el.addEventListener('keyup', cancel);
  // A held button fires from the timer only — swallow the click
  // so a completed hold never double-fires.
  el.addEventListener('click', (e) => e.preventDefault());
}

/* ---------- Settings modal ---------- */

const closeBtn = $('closeSettings');

function selectTab(name) {
  document.querySelectorAll('.side-btn').forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    const on = p.dataset.tab === name;
    p.classList.toggle('active', on);
    p.hidden = !on;
  });
}

document.querySelectorAll('.side-btn').forEach((b) => {
  b.addEventListener('click', () => selectTab(b.dataset.tab));
});

/* ---------- The Ideas Engine (Settings → Ideas) ----------
   The Google Form's link (Send → link icon → Copy). The button switches
   itself on when this is a real URL. The form opens in a new tab — that
   one step needs internet; the app itself never does. */
const SUGGEST_URL = 'https://forms.gle/bjPLDgdWpkLaNFEz5';
/* The site's home page (the menu) — the header's 🏠 button holds for
   1 second and navigates here. Needs internet only when pressed. */
const HOME_URL = 'https://swankymcgee.github.io/';

(function setupSuggest() {
  const btn = $('suggestBtn');
  const hint = $('suggestHint');
  if (/^https?:\/\//i.test(SUGGEST_URL)) {
    btn.addEventListener('click', () => {
      window.open(SUGGEST_URL, '_blank', 'noopener');
    });
    hint.textContent = 'Opens The Ideas Engine in a new tab — that step needs ' +
      'internet, but the app itself keeps working offline. Every response is ' +
      'read; nothing is posted publicly.';
  } else {
    btn.disabled = true;
    hint.textContent = 'Not connected yet — paste the Google Form link into ' +
      'SUGGEST_URL at the top of app.js and this button switches on.';
  }
})();

// The footer shortcut jumps straight to the Ideas tab
$('suggestTab').addEventListener('click', () => {
  selectTab('ideas');
  const side = document.querySelector('.side-btn[data-tab="ideas"]');
  if (side) side.focus();
});

function openSettings() {
  syncSettingsInputs();
  settingsModal.hidden = false;
  selectTab('timers'); // always open on the first tab
  closeBtn.focus();
}

function closeSettings() {
  settingsModal.hidden = true;
  gearBtn.focus();
}

closeBtn.addEventListener('click', closeSettings);
$('doneSettings').addEventListener('click', closeSettings);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsModal.hidden) closeSettings();
});

/* ---------- Settings: wiring ---------- */

function durationsChanged() {
  // Each cycle must be at least 10 seconds
  if (fullMs('work') < 10000) { settings.workMinutes = 0; settings.workSeconds = 10; }
  if (fullMs('earn') < 10000) { settings.earnMinutes = 0; settings.earnSeconds = 10; }
  syncDurationInputs();
  saveSettings();
  if (phase === 'ready' || phase === 'paused') remainingMs = fullMs(mode);
  render();
}

function bindDuration(id, key) {
  const el = $(id);
  el.addEventListener('change', () => {
    const isSeconds = id.indexOf('Sec') !== -1;
    settings[key] = parseNum(el.value, 0, isSeconds ? 59 : 180, DEFAULTS[key]);
    durationsChanged();
  });
}

bindDuration('workMin', 'workMinutes');
bindDuration('workSec', 'workSeconds');
bindDuration('earnMin', 'earnMinutes');
bindDuration('earnSec', 'earnSeconds');

function syncDurationInputs() {
  $('workMin').value = settings.workMinutes;
  $('workSec').value = settings.workSeconds;
  $('earnMin').value = settings.earnMinutes;
  $('earnSec').value = settings.earnSeconds;
}

function bindSelect(id, key, after) {
  $(id).addEventListener('change', (e) => {
    settings[key] = e.target.value;
    saveSettings();
    if (after) after();
  });
}

function bindCheck(id, key, after) {
  $(id).addEventListener('change', (e) => {
    settings[key] = e.target.checked;
    saveSettings();
    if (after) after();
  });
}

function bindRange(id, key, after) {
  $(id).addEventListener('input', (e) => {
    settings[key] = parseInt(e.target.value, 10) || 0;
    saveSettings();
    if (after) after();
  });
}

bindSelect('endBehavior', 'endBehavior', render);

// Work cycles per earn (−/+ stepper) — a new target starts the count fresh
function syncCyclesStepper() {
  const v = workCyclesTarget();
  $('cyclesVal').textContent = v;
  $('cyclesNote').textContent = v === 1
    ? 'work, earn, work, earn…'
    : v + ' work cycles, then Earn';
  $('cyclesDown').disabled = v <= 1;
  $('cyclesUp').disabled = v >= 10;
}

function bumpWorkCycles(delta) {
  const v = clamp(workCyclesTarget() + delta, 1, 10);
  if (v === workCyclesTarget()) return;   // already at the limit
  settings.workCycles = v;
  workDone = 0;
  saveSettings();
  syncCyclesStepper();
  render();
}

$('cyclesDown').addEventListener('click', () => bumpWorkCycles(-1));
$('cyclesUp').addEventListener('click', () => bumpWorkCycles(1));

bindCheck('warningsOn', 'warningsOn', applySettings);
bindCheck('warn120', 'warn120');
bindCheck('warn60', 'warn60');
bindCheck('warn30', 'warn30');

bindCheck('soundOn', 'soundOn');
bindSelect('soundType', 'soundType');
bindRange('soundVol', 'soundVol', applySettings);

bindCheck('flashOn', 'flashOn', applySettings);
bindCheck('largeText', 'largeText', applySettings);
bindSelect('layout', 'layout', applySettings);

bindRange('videoOpacity', 'videoOpacity', applySettings);
bindRange('musicVol', 'musicVol', () => {
  $('mediaVol').value = settings.musicVol;   // keep header slider in step
  applySettings();
});
bindRange('mediaVol', 'musicVol', () => {
  $('musicVol').value = settings.musicVol;   // keep settings slider in step
  applySettings();
});

bindSelect('animSelect', 'anim', applySettings);
bindSelect('animReact', 'animReact', () => {
  // Counts and placements differ per level — rebuild for a clean start
  if (animRaf) initAnimEntities();
});
bindRange('animOpacity', 'animOpacity', applySettings);

$('testSound').addEventListener('click', () => {
  const wasOn = settings.soundOn;
  settings.soundOn = true;
  playSound('transition');
  settings.soundOn = wasOn;
});

$('resetSettings').addEventListener('click', () => {
  if (!window.confirm('Reset all settings back to their defaults?')) return;
  const keepTitle = settings.title;   // a custom title is identity, not a preference
  Object.assign(settings, DEFAULTS);
  settings.title = keepTitle;
  settings.playlistOrder = [];        // fresh arrays — never share DEFAULTS' references
  settings.playlistHidden = [];
  workDone = 0;   // progress toward the Earn restarts with the defaults
  saveSettings();
  syncSettingsInputs();
  applySettings();
  populateMedia();
  applyVideo();
  applyMusic();
  syncMediaUi();
  if (phase === 'ready' || phase === 'paused') remainingMs = fullMs(mode);
  render();
});

function syncSettingsInputs() {
  syncDurationInputs();
  $('endBehavior').value = settings.endBehavior;
  syncCyclesStepper();
  $('warningsOn').checked = settings.warningsOn;
  $('warn120').checked = settings.warn120;
  $('warn60').checked = settings.warn60;
  $('warn30').checked = settings.warn30;
  $('soundOn').checked = settings.soundOn;
  $('soundType').value = settings.soundType;
  $('soundVol').value = settings.soundVol;
  $('flashOn').checked = settings.flashOn;
  $('largeText').checked = settings.largeText;
  $('layout').value = settings.layout;
  $('videoOpacity').value = settings.videoOpacity;
  $('musicVol').value = settings.musicVol;
  $('mediaVol').value = settings.musicVol;
  $('animSelect').value = settings.anim;
  $('animReact').value = settings.animReact;
  $('animOpacity').value = settings.animOpacity;
  syncThemePicker();
  applySettings();
}

function applySettings() {
  document.body.dataset.theme = settings.theme;
  document.documentElement.classList.toggle('large-text', !!settings.largeText);
  document.body.classList.toggle('layout-single', settings.layout === 'single');
  document.body.classList.toggle('flash-enabled', !!settings.flashOn);

  bgVideo.style.opacity = String(clamp(settings.videoOpacity, 0, 100) / 100);
  bgMusic.volume = clamp(settings.musicVol, 0, 100) / 100;
  animCanvas.style.opacity = String(clamp(settings.animOpacity, 0, 100) / 100);
  updateAnim();

  for (const t of [120, 60, 30]) {
    $('warn' + t).disabled = !settings.warningsOn;
  }

  $('soundVolVal').textContent = settings.soundVol + '%';
  $('videoOpacityVal').textContent = settings.videoOpacity + '%';
  $('musicVolVal').textContent = settings.musicVol + '%';
}

/* ---------- Theme picker (Settings → Display) ----------
   Replaces the old dropdown: one row per palette with live color chips
   so you can see what you're picking before you commit. Clicking a row
   applies it instantly, exactly like the select it replaced. */

function renderThemePicker() {
  const box = $('themeList');
  if (!box) return;
  box.innerHTML = '';
  for (const t of THEMES) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'theme-opt';
    row.dataset.theme = t.id;
    row.setAttribute('aria-pressed', settings.theme === t.id ? 'true' : 'false');
    if (settings.theme === t.id) row.classList.add('active');

    const name = document.createElement('span');
    name.className = 'theme-name';
    name.textContent = t.name;

    const chips = document.createElement('span');
    chips.className = 'theme-chips';
    chips.setAttribute('aria-hidden', 'true');   // the name says it all
    for (const hex of t.chips) {
      const chip = document.createElement('span');
      chip.className = 'theme-chip';
      chip.style.background = hex;
      chips.appendChild(chip);
    }

    row.append(name, chips);
    row.addEventListener('click', () => {
      settings.theme = t.id;
      saveSettings();
      applySettings();
      syncThemePicker();
    });
    box.appendChild(row);
  }
}

function syncThemePicker() {
  const box = $('themeList');
  if (!box) return;
  for (const row of box.querySelectorAll('.theme-opt')) {
    const on = row.dataset.theme === settings.theme;
    row.classList.toggle('active', on);
    row.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

renderThemePicker();

/* ---------- Background media ----------
   Videos are session-only (blob URLs die with the page). Music is a
   playlist: every track has a key — built-ins are keyed by their src,
   added files by "file:<id>" — and settings.bgMusic holds that key. */

const sessionVideos = [];   // {name, src} — gone on reload
const addedMusic = [];      // {key, name, src} — reloaded from IndexedDB

function builtinMusicEntries() {
  const lib = (window.SENSORY_MEDIA && window.SENSORY_MEDIA.music) || [];
  return lib.map((e) => ({ key: e.src, name: e.name, src: e.src }));
}

function allMusicEntries() {
  const out = [];
  const seen = new Set();
  for (const e of builtinMusicEntries().concat(addedMusic)) {
    if (!e || !e.key || seen.has(e.key)) continue;
    seen.add(e.key);
    out.push({ key: e.key, name: e.name, src: e.src, value: e.key });
  }
  return out;
}

function entryByKey(key) {
  if (typeof key !== 'string' || !key) return null;
  const entries = allMusicEntries();
  for (const e of entries) {
    if (e.key === key) return e;
  }
  return null;
}

function resolveMusicSrc(key) {
  const e = entryByKey(key);
  return e ? e.src : '';
}

/* The play queue: known tracks in playlist order, minus removed ones.
   Tracks missing from playlistOrder (a freshly added built-in, say)
   simply ride along at the end. */
function musicQueue() {
  const entries = allMusicEntries();
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const hidden = new Set(settings.playlistHidden);
  const seen = new Set();
  const q = [];
  for (const k of settings.playlistOrder) {
    if (seen.has(k)) continue;
    seen.add(k);
    const e = byKey.get(k);
    if (e && !hidden.has(k)) q.push(e);
  }
  for (const e of entries) {
    if (seen.has(e.key)) continue;
    seen.add(e.key);
    if (!hidden.has(e.key)) q.push(e);
  }
  return q;
}

function videoEntries() {
  const lib = (window.SENSORY_MEDIA && window.SENSORY_MEDIA.videos) || [];
  return lib.concat(sessionVideos).map((e) => ({
    name: e.name, src: e.src, value: e.src, session: !!e.session
  }));
}

function fillSelect(sel, entries, current, noneLabel) {
  sel.innerHTML = '';
  sel.appendChild(new Option(noneLabel, ''));
  for (const e of entries) {
    sel.appendChild(new Option(e.name + (e.session ? ' (this session)' : ''), e.value));
  }
  sel.value = current || '';
  if (sel.selectedIndex < 0) sel.value = '';
}

function populateMedia() {
  fillSelect($('videoSelect'), videoEntries(), settings.bgVideo, 'None');
  // Music dropdowns mirror the queue, so removed tracks stay out of sight
  // until Restore brings them back.
  fillSelect($('musicSelect'), musicQueue(), settings.bgMusic, 'None');
  fillSelect($('trackSelect'), musicQueue(), settings.bgMusic, 'None');
  renderPlaylist();
  syncPlaylistUi();
}

function applyVideo() {
  const src = settings.bgVideo;
  if (!src) {
    bgVideo.pause();
    bgVideo.removeAttribute('src');
    return;
  }
  if (bgVideo.getAttribute('src') === src) return;
  bgVideo.src = src;
  bgVideo.play().catch(() => {});
}

function applyMusic(autoplay) {
  const src = resolveMusicSrc(settings.bgMusic);
  bgMusic.loop = settings.repeatMode === 'one';   // "one song" = native loop
  if (!src) {
    bgMusic.pause();
    bgMusic.removeAttribute('src');
    return;
  }
  if (bgMusic.getAttribute('src') === src) return;
  bgMusic.src = src;
  bgMusic.volume = clamp(settings.musicVol, 0, 100) / 100;
  // autoplay === false loads the track paused: a session NEVER starts with
  // audio playing — music only ever begins from a deliberate hold/pick.
  if (autoplay !== false) bgMusic.play().catch(() => {});
}

function addVideoFiles(input) {
  for (const file of input.files) {
    sessionVideos.push({
      name: file.name.replace(/\.[^.]+$/, ''),
      src: URL.createObjectURL(file),
      session: true
    });
  }
  if (input.files.length) {
    settings.bgVideo = sessionVideos[sessionVideos.length - 1].src;
    saveSettings();
    populateMedia();
    applyVideo();
  }
  input.value = '';
}

/* ---------- Remembered music files (IndexedDB) ----------
   Added tracks are stored as blobs so they survive reloads. If
   IndexedDB is unavailable — some browsers block it on file:// pages —
   every call here fails softly and the files behave session-only,
   exactly like videos. */

const IDB_NAME = 'workCycleTimer';
const IDB_STORE = 'musicFiles';

function idbOpen() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
    let req;
    try {
      req = indexedDB.open(IDB_NAME, 1);
    } catch (err) {
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}

function idbTx(mode, fn) {
  return idbOpen().then((db) => new Promise((resolve, reject) => {
    let result;
    try {
      const tx = db.transaction(IDB_STORE, mode);
      const req = fn(tx.objectStore(IDB_STORE));
      if (req) req.onsuccess = () => { result = req.result; };
      tx.oncomplete = () => {
        try { db.close(); } catch (err) { /* ignore */ }
        resolve(result);
      };
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    } catch (err) {
      reject(err);
    }
  }));
}

const idbPut = (record) => idbTx('readwrite', (store) => store.put(record));
const idbDelete = (key) => idbTx('readwrite', (store) => store.delete(key));
const idbGetAll = () => idbTx('readonly', (store) => store.getAll());

async function loadPersistedFiles() {
  let records = [];
  try {
    records = await idbGetAll();
  } catch (err) {
    records = [];   // blocked or unavailable — added files are session-only
  }
  if (Array.isArray(records)) {
    for (const r of records) {
      if (!r || typeof r.key !== 'string' || !r.blob) continue;
      if (entryByKey(r.key)) continue;
      let url = '';
      try {
        url = URL.createObjectURL(r.blob);
      } catch (err) {
        continue;
      }
      addedMusic.push({
        key: r.key,
        name: String(r.name || 'Added track').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Added track',
        src: url
      });
    }
  }
  // Forget keys that no longer resolve (IDB blocked, playlist.js edited…)
  const known = new Set(allMusicEntries().map((e) => e.key));
  const before = JSON.stringify([settings.playlistOrder, settings.playlistHidden, settings.bgMusic]);
  settings.playlistOrder = settings.playlistOrder.filter((k) => known.has(k));
  settings.playlistHidden = settings.playlistHidden.filter((k) => known.has(k));
  if (settings.bgMusic &&
      (!known.has(settings.bgMusic) ||
       settings.playlistHidden.indexOf(settings.bgMusic) !== -1)) {
    settings.bgMusic = '';   // pointing at a removed or missing track
  }
  const after = JSON.stringify([settings.playlistOrder, settings.playlistHidden, settings.bgMusic]);
  if (before !== after) saveSettings();

  populateMedia();
  applyMusic(false);   // restoring files after load: still never auto-plays
  syncMediaUi();
}

function addMusicFiles(input) {
  let lastKey = '';
  for (const file of input.files) {
    const key = 'file:' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    const entry = {
      key: key,
      name: file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Added track',
      src: URL.createObjectURL(file)
    };
    addedMusic.push(entry);
    settings.playlistOrder.push(key);
    idbPut({ key: key, name: entry.name, blob: file }).catch(() => {});   // best-effort
    lastKey = key;
  }
  if (lastKey) {
    settings.bgMusic = lastKey;   // the newest add becomes the current track
    saveSettings();
    populateMedia();
    applyMusic();
    syncMediaUi();
  }
  input.value = '';
}

$('videoSelect').addEventListener('change', (e) => {
  settings.bgVideo = e.target.value;
  saveSettings();
  applyVideo();
});

$('musicSelect').addEventListener('change', (e) => {
  settings.bgMusic = e.target.value;
  saveSettings();
  populateMedia();   // keep the header track dropdown in step
  applyMusic();
  syncMediaUi();
});

// Header track dropdown — same setting as Settings → Media
$('trackSelect').addEventListener('change', (e) => {
  settings.bgMusic = e.target.value;
  saveSettings();
  populateMedia();
  applyMusic();
  syncMediaUi();
});

$('videoFile').addEventListener('change', (e) => addVideoFiles(e.target));
$('musicFile').addEventListener('change', (e) => addMusicFiles(e.target));

/* ---------- Music playlist (Settings → Media) ----------
   One visible list holds every track. Drag the grip to reorder, arrow
   keys work too, clicking a name jumps to it, × removes a track.
   Order and removals live in settings (playlistOrder / playlistHidden)
   so they persist across reloads. */

const GRIP_SVG =
  '<svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true" focusable="false">' +
  '<circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>' +
  '<circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>' +
  '<circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>';

const REPEAT_LABELS = {
  off: 'Repeat: Off',
  all: 'Repeat: Playlist',
  one: 'Repeat: One song'
};

function renderPlaylist() {
  const box = $('playlist');
  box.innerHTML = '';
  const q = musicQueue();
  if (!q.length) {
    const empty = document.createElement('p');
    empty.className = 'pl-empty';
    empty.textContent = 'No tracks yet — add music files above, or bring back ' +
      'removed ones with Restore removed.';
    box.appendChild(empty);
    return;
  }
  const playing = !bgMusic.paused && !!bgMusic.getAttribute('src');
  for (const e of q) {
    const row = document.createElement('div');
    row.className = 'pl-row';
    row.setAttribute('role', 'listitem');
    row.dataset.key = e.key;
    if (e.key === settings.bgMusic) {
      row.classList.add('is-current');
      if (playing) row.classList.add('is-playing');
    }

    const grip = document.createElement('button');
    grip.type = 'button';
    grip.className = 'pl-grip';
    grip.innerHTML = GRIP_SVG;
    grip.title = 'Drag to reorder — or focus and press \u2191 / \u2193';
    grip.setAttribute('aria-label', 'Reorder ' + e.name + ' (drag, or press arrow keys)');
    grip.addEventListener('pointerdown', (ev) => startDrag(ev, row));
    grip.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        moveTrack(e.key, ev.key === 'ArrowUp' ? -1 : 1, e.key);
      }
    });

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'pl-name';
    name.textContent = e.name;
    name.title = 'Play ' + e.name;
    name.addEventListener('click', () => jumpToTrack(e.key));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'pl-del';
    del.innerHTML = '&times;';
    del.title = 'Remove ' + e.name;
    del.setAttribute('aria-label', 'Remove ' + e.name + ' from the playlist');
    del.addEventListener('click', () => removeTrack(e.key));

    row.append(grip, name, del);
    box.appendChild(row);
  }
}

function syncPlaylistPlaying() {
  const playing = !bgMusic.paused && !!bgMusic.getAttribute('src');
  const rows = $('playlist').querySelectorAll('.pl-row');
  for (const row of rows) {
    const isCurrent = row.dataset.key === settings.bgMusic;
    row.classList.toggle('is-current', isCurrent);
    row.classList.toggle('is-playing', isCurrent && playing);
  }
}

function syncPlaylistUi() {
  const q = musicQueue();
  $('plShuffle').disabled = q.length < 2;
  $('plRestore').disabled = settings.playlistHidden.length === 0;
  const label = REPEAT_LABELS[settings.repeatMode] || REPEAT_LABELS.off;
  $('plRepeat').textContent = label;
  $('plRepeat').setAttribute('aria-pressed', settings.repeatMode === 'off' ? 'false' : 'true');
  syncPlaylistPlaying();
}

/* Commit a new visible order. Removed tracks stay parked at the spot
   they occupied, so Restore puts them back where they were. */
function setPlaylistOrder(visibleKeys) {
  const hiddenSet = new Set(settings.playlistHidden);
  const parked = new Map();   // visible key it followed → [removed keys]
  let lastVisible = null;
  for (const k of settings.playlistOrder) {
    if (hiddenSet.has(k)) {
      const slot = lastVisible === null ? '' : lastVisible;
      if (!parked.has(slot)) parked.set(slot, []);
      parked.get(slot).push(k);
    } else {
      lastVisible = k;
    }
  }
  const out = [];
  const used = new Set();
  for (const h of parked.get('') || []) {
    out.push(h);
    used.add(h);
  }
  for (const k of visibleKeys) {
    if (used.has(k)) continue;
    out.push(k);
    used.add(k);
    for (const h of parked.get(k) || []) {
      if (!used.has(h)) {
        out.push(h);
        used.add(h);
      }
    }
  }
  for (const list of parked.values()) {   // anchors that vanished → keep at end
    for (const h of list) {
      if (!used.has(h)) {
        out.push(h);
        used.add(h);
      }
    }
  }
  settings.playlistOrder = out;
}

function moveTrack(key, dir, refocusKey) {
  const keys = musicQueue().map((e) => e.key);
  const i = keys.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= keys.length) return;
  const tmp = keys[i];
  keys[i] = keys[j];
  keys[j] = tmp;
  setPlaylistOrder(keys);
  saveSettings();
  populateMedia();
  if (refocusKey) {
    const grip = $('playlist').querySelector(
      '.pl-row[data-key="' + refocusKey + '"] .pl-grip');
    if (grip) grip.focus();
  }
}

function jumpToTrack(key) {
  if (!entryByKey(key)) return;
  if (key === settings.bgMusic) {
    if (bgMusic.paused) bgMusic.play().catch(() => {});   // click current = resume
    syncMediaUi();
    return;
  }
  startTrack(key, false);
}

function removeTrack(key) {
  if (typeof key !== 'string' || !key) return;
  const wasCurrent = settings.bgMusic === key;
  const wasPlaying = wasCurrent && !bgMusic.paused;

  if (wasCurrent) {
    // Stop first — this file's blob URL may be revoked below.
    bgMusic.pause();
    bgMusic.removeAttribute('src');
    settings.bgMusic = '';
  }

  if (key.indexOf('file:') === 0) {
    const i = addedMusic.findIndex((e) => e.key === key);
    if (i >= 0) {
      try { URL.revokeObjectURL(addedMusic[i].src); } catch (err) { /* ignore */ }
      addedMusic.splice(i, 1);
    }
    idbDelete(key).catch(() => {});
    settings.playlistOrder = settings.playlistOrder.filter((k) => k !== key);
    settings.playlistHidden = settings.playlistHidden.filter((k) => k !== key);
  } else if (settings.playlistHidden.indexOf(key) === -1) {
    settings.playlistHidden.push(key);   // built-ins are parked, not deleted
  }

  // Removing the track that's playing? Keep the mood going with the new top.
  // Removing it while paused? Load the new top but stay paused.
  if (wasCurrent && wasPlaying) {
    const q = musicQueue();
    if (q.length) settings.bgMusic = q[0].key;
  }

  saveSettings();
  populateMedia();
  if (wasCurrent && settings.bgMusic) applyMusic(wasPlaying);
  syncMediaUi();
}

/* ---------- Pointer drag reorder ---------- */

let drag = null;

function startDrag(ev, row) {
  if (ev.button !== undefined && ev.button !== 0) return;
  drag = { row: row, box: $('playlist'), pointerId: ev.pointerId, startY: ev.clientY, moved: false };
  row.classList.add('dragging');
  try { ev.target.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
}

function onDragMove(ev) {
  if (!drag || ev.pointerId !== drag.pointerId) return;
  if (!drag.row.isConnected) {
    // The list re-rendered mid-drag (a track ended, say) — abandon it.
    drag.row.classList.remove('dragging');
    drag.row.style.transform = '';
    drag = null;
    return;
  }
  let dy = ev.clientY - drag.startY;
  if (!drag.moved) {
    if (Math.abs(dy) < 4) return;   // a click, not a drag
    drag.moved = true;
  }
  const rows = Array.from(drag.box.querySelectorAll('.pl-row'))
    .filter((r) => r !== drag.row);
  let insertAt = rows.length;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].getBoundingClientRect();
    if (ev.clientY < r.top + r.height / 2) {
      insertAt = i;
      break;
    }
  }
  const ref = insertAt >= rows.length ? null : rows[insertAt];
  const needsMove = ref === null
    ? drag.box.lastElementChild !== drag.row
    : drag.row.nextElementSibling !== ref;
  if (needsMove) {
    // Move in the DOM, then shift the baseline so the row stays
    // glued to the cursor despite its new layout position.
    const layoutBefore = drag.row.getBoundingClientRect().top - dy;
    if (ref === null) drag.box.appendChild(drag.row);
    else drag.box.insertBefore(drag.row, ref);
    const layoutAfter = drag.row.getBoundingClientRect().top - dy;
    drag.startY += layoutAfter - layoutBefore;
    dy = ev.clientY - drag.startY;
  }
  drag.row.style.transform = 'translateY(' + dy + 'px)';
}

function endDrag(ev) {
  if (!drag || (ev && ev.pointerId !== drag.pointerId)) return;
  const moved = drag.moved;
  drag.row.classList.remove('dragging');
  drag.row.style.transform = '';
  drag = null;
  if (!moved) return;
  const keys = Array.from($('playlist').querySelectorAll('.pl-row'))
    .map((r) => r.dataset.key);
  setPlaylistOrder(keys);
  saveSettings();
  populateMedia();
}

window.addEventListener('pointermove', onDragMove);
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

/* ---------- Playlist actions ---------- */

$('plShuffle').addEventListener('click', () => {
  const keys = musicQueue().map((e) => e.key);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;
  }
  setPlaylistOrder(keys);
  saveSettings();
  populateMedia();
});

$('plRepeat').addEventListener('click', () => {
  settings.repeatMode = settings.repeatMode === 'off' ? 'all'
    : settings.repeatMode === 'all' ? 'one' : 'off';
  bgMusic.loop = settings.repeatMode === 'one';
  saveSettings();
  syncPlaylistUi();
});

$('plRestore').addEventListener('click', () => {
  if (!settings.playlistHidden.length) return;
  settings.playlistHidden = [];
  saveSettings();
  populateMedia();
});

/* ---------- Hold-to-activate wiring (kid-safe) ----------
   1.5s for the frequently used controls, 3s for the gear.  */

makeHoldable(mainBtn, 1000, onMain);
makeHoldable($('resetBtn'), 1000, onReset);
makeHoldable($('skipBtn'), 1000, onSkip);
makeHoldable($('homeBtn'), 1000, () => { window.location.href = HOME_URL; });
makeHoldable(gearBtn, 3000, openSettings);

/* ---------- Header media controls (hold-to-activate) ---------- */

function currentMusicName() {
  const e = entryByKey(settings.bgMusic);
  return e ? e.name : '';
}

function syncMediaUi() {
  const name = currentMusicName();
  const playing = !bgMusic.paused && !!bgMusic.getAttribute('src');
  $('playIcon').style.display = playing ? 'none' : '';
  $('pauseIcon').style.display = playing ? '' : 'none';

  const verb = playing ? 'Pause' : 'Play';
  const what = name || 'music';
  const pp = $('playPauseBtn');
  pp.title = 'Hold for 1 second to ' + verb.toLowerCase() + ' ' + what;
  pp.setAttribute('aria-label', verb + ' ' + what + ' (hold 1 second)');
  $('prevTrackBtn').setAttribute('aria-label', 'Previous track (hold 1 second)');
  $('nextTrackBtn').setAttribute('aria-label', 'Next track (hold 1 second)');
  syncPlaylistPlaying();
}

/* Load a track and play it (unless keepPaused). Re-selecting the track
   that's already loaded restarts it instead of silently doing nothing. */
function startTrack(key, keepPaused) {
  const src = resolveMusicSrc(key);
  const same = !!src && bgMusic.getAttribute('src') === src;
  settings.bgMusic = key;
  saveSettings();
  populateMedia();
  if (same) {
    try { bgMusic.currentTime = 0; } catch (err) { /* not loaded yet */ }
    if (keepPaused) bgMusic.pause();
    else bgMusic.play().catch(() => {});
  } else {
    applyMusic();   // loads the new src and plays
    if (keepPaused) bgMusic.pause();
  }
  syncMediaUi();
}

function togglePlay() {
  const q = musicQueue();
  if (!q.length) {
    showBanner('No music yet — pick a track in Settings → Media.', 4000);
    return;
  }
  if (!bgMusic.paused) {
    bgMusic.pause();
    return;
  }
  if (!bgMusic.getAttribute('src') || bgMusic.ended) {
    // Nothing loaded, or the queue ran out: (re)start from the top.
    const top = q[0];
    if (top.key !== settings.bgMusic) {
      startTrack(top.key, false);
      return;
    }
    try { bgMusic.currentTime = 0; } catch (err) { /* ignore */ }
  }
  bgMusic.play().catch(() => {});
}

function stepTrack(dir) {
  const q = musicQueue();
  if (!q.length) {
    showBanner('No music yet — pick a track in Settings → Media.', 4000);
    return;
  }
  let i = -1;
  for (let k = 0; k < q.length; k++) {
    if (q[k].key === settings.bgMusic) { i = k; break; }
  }
  // From "None": next starts at the first track, prev at the last
  const next = i === -1
    ? (dir > 0 ? 0 : q.length - 1)
    : (i + dir + q.length) % q.length;
  const wasPaused = bgMusic.paused;
  const fromNone = i === -1;   // picking the first/last track from
                               // "None" should actually start the music
  startTrack(q[next].key, wasPaused && !fromNone);
}

/* A track ran out: keep walking the queue according to the repeat mode.
   Repeat: Off plays through once and stops; Playlist wraps around;
   One song uses the native loop, so 'ended' never even fires there. */
function onMusicEnded() {
  if (settings.repeatMode === 'one') return;
  const q = musicQueue();
  if (!q.length) { syncMediaUi(); return; }
  let i = -1;
  for (let k = 0; k < q.length; k++) {
    if (q[k].key === settings.bgMusic) { i = k; break; }
  }
  if (i === -1) { syncMediaUi(); return; }   // current track vanished — stop
  if (i < q.length - 1) {
    startTrack(q[i + 1].key, false);
  } else if (settings.repeatMode === 'all') {
    startTrack(q[0].key, false);
  } else {
    syncMediaUi();   // end of the queue with repeat off — stop here
  }
}

makeHoldable($('playPauseBtn'), 1000, togglePlay);
makeHoldable($('prevTrackBtn'), 1000, () => stepTrack(-1));
makeHoldable($('nextTrackBtn'), 1000, () => stepTrack(1));

bgMusic.addEventListener('play', syncMediaUi);
bgMusic.addEventListener('pause', syncMediaUi);
bgMusic.addEventListener('ended', onMusicEnded);

/* ---------- Editable title (embossed pencil next to the title) ---------- */

const appTitle = $('appTitle');
const titleInput = $('titleInput');
const editTitleBtn = $('editTitleBtn');
let editingTitle = false;
let titleSavedAt = 0;

function applyTitle() {
  const t = settings.title || DEFAULTS.title;
  appTitle.textContent = t;
  document.title = t;
}

function enterTitleEdit() {
  if (editingTitle) return;
  editingTitle = true;
  titleInput.value = appTitle.textContent;
  titleInput.size = clamp(titleInput.value.length + 1, 10, 60);
  appTitle.hidden = true;
  titleInput.hidden = false;
  titleInput.focus();
  titleInput.select();
}

function exitTitleEdit(save) {
  if (!editingTitle) return;
  editingTitle = false;
  if (save) {
    const v = titleInput.value.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (v && v !== settings.title) {
      settings.title = v;
      saveSettings();
    }
    titleSavedAt = Date.now();
  }
  titleInput.hidden = true;
  appTitle.hidden = false;
  applyTitle();   // shows saved text (or the old one after Escape)
}

editTitleBtn.addEventListener('click', () => {
  // If this click is what ended the edit (via blur), don't reopen it
  if (!editingTitle && Date.now() - titleSavedAt < 300) return;
  if (editingTitle) exitTitleEdit(true);   // usually already saved by blur
  else enterTitleEdit();
});

titleInput.addEventListener('blur', () => exitTitleEdit(true));

titleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    exitTitleEdit(true);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    exitTitleEdit(false);   // cancel — leave the title unchanged
  }
});

/* ---------- Init ---------- */

applySettings();
applyTitle();
populateMedia();
applyVideo();
applyMusic(false);   // never open a session with audio — music waits for a hold
syncMediaUi();
loadPersistedFiles().catch(() => {});   // restore added music files, then re-sync
syncSettingsInputs();
remainingMs = fullMs(mode);
render();

setInterval(tick, 100);

/* ---------- Easter egg ----------
   Click the title 5 times (within ~2.5s of each other) to reveal a
   hidden Windows logo; its position is randomized on every page load.
   Clicking the logo fills the screen with cute XP-style hills.        */

const titleEl = document.querySelector('.brand h1');
const winLogo = $('winLogo');
const xpScene = $('xpScene');
let titleClicks = 0;
let titleClickTimer = null;

function placeWinLogo() {
  // percentage positions keep it inside the visible area at any window size
  winLogo.style.left = (2 + Math.random() * 86).toFixed(1) + '%';
  winLogo.style.top = (2 + Math.random() * 84).toFixed(1) + '%';
}

placeWinLogo();

titleEl.addEventListener('click', () => {
  titleClicks++;
  clearTimeout(titleClickTimer);
  titleClickTimer = setTimeout(() => { titleClicks = 0; }, 2500);
  if (titleClicks >= 5) {
    titleClicks = 0;
    clearTimeout(titleClickTimer);
    winLogo.classList.add('shown');
  }
});

winLogo.addEventListener('click', (e) => {
  e.stopPropagation();
  xpScene.hidden = false;
});

xpScene.addEventListener('click', () => {
  xpScene.hidden = true;
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !xpScene.hidden) xpScene.hidden = true;
});
