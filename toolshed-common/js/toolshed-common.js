/* ============================================================
   toolshed-common — shared runtime for The Learning Toolshed
   projects: site, morning-work, math-playground, work-cycle-timer.

   Import once per page (before first paint):
     <script src="https://swankymcgee.github.io/toolshed-common/js/toolshed-common.js"></script>

   Or locally during development:
     <script src="/toolshed-common/js/toolshed-common.js"></script>

   This module exposes:
     THEMES           — the 11 color palettes (array of {id, name, chips})
     STORAGE_KEY      — 'workCycleTimer.settings.v1'
     readTheme()      — returns current theme id, validates against THEMES
     patchSettings()  — patches single fields in shared localStorage key
     writeTheme()     — convenience: patchSettings({ theme: id })
     motifsOn()       — reads homeMotifs flag (default true)
     syncMotifs()     — applies motifs-off class to documentElement
     applyTheme()     — sets data-theme + syncs picker UI
     syncPicker()     — highlights active theme in picker panel
     makeHoldable()   — attaches hold-to-activate behavior to any element
     makeHoldBtn()    — creates a hold button with visual progress ring
     injectHeader()   — builds brand + tool nav + sound/settings/home holds
     injectFooter()   — builds footer with home link
     initCommon()     — one-call setup: applyTheme(readTheme()), syncMotifs(),
                        injectHeader(), injectFooter(), storage listener

   Each tool provides its own:
     - tool-specific settings key (e.g., 'workCycleTimer.morning.v1')
     - tool-specific parts/games config
     - tool-specific init*() function called after initCommon()
   ============================================================ */

'use strict';

/* ---------- The 11 shared palettes ----------
   chips = [page background, surface, text, accent, second accent].
   Keep in step with the [data-theme] blocks in toolshed-common.css.
   Do NOT edit here — edit the CSS and this array together, or use
   the generate-themes.ps1 script to keep them in sync. */
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

/* The shared localStorage key — holds theme, homeMotifs, and any
   other cross-tool settings (timer durations, music, etc.). */
const STORAGE_KEY = 'workCycleTimer.settings.v1';

/* ---------- Theme helpers ---------- */

function readTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && THEMES.some((t) => t.id === s.theme)) return s.theme;
    }
  } catch (err) { /* storage blocked — fall through */ }
  return 'calm';
}

function patchSettings(fields) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    if (!s || typeof s !== 'object') return false;
    Object.assign(s, fields);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch (err) {
    return false;
  }
}

function writeTheme(id) { return patchSettings({ theme: id }); }

function motifsOn() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.homeMotifs === false) return false;
    }
  } catch (err) { /* default on */ }
  return true;
}

function syncMotifs() {
  const on = motifsOn();
  document.documentElement.classList.toggle('motifs-off', !on);
  const btn = document.getElementById('motifBtn');
  if (btn) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    const state = document.getElementById('motifState');
    if (state) state.textContent = on ? 'On' : 'Off';
  }
}

function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  syncPicker(id);
}

function syncPicker(id) {
  const panel = document.getElementById('themePanel');
  if (!panel) return;
  for (const row of panel.querySelectorAll('.theme-opt')) {
    const on = row.dataset.theme === id;
    row.classList.toggle('active', on);
    row.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

/* ---------- Hold-to-activate system ---------- */

function makeHoldable(el, ms, action) {
  if (!el) return;
  let timer = null;
  let raf = null;
  const fill = el.querySelector('.hold-fill');
  const start = () => {
    timer = setTimeout(action, ms);
    if (fill) {
      const dur = ms / 1000;
      fill.style.transition = `transform ${dur}s linear`;
      fill.style.transform = 'scaleX(1)';
    }
    el.classList.add('holding');
  };
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (fill) {
      fill.style.transition = '';
      fill.style.transform = 'scaleX(0)';
    }
    el.classList.remove('holding');
  };
  const down = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    start();
  };
  const up = () => cancel();
  el.addEventListener('mousedown', down);
  el.addEventListener('touchstart', down, { passive: true });
  el.addEventListener('keydown', down);
  window.addEventListener('mouseup', up);
  window.addEventListener('touchend', up);
  window.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') up(); });
}

function makeHoldBtn(kind, label, ms, action) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `hold-btn ${kind}-btn`;
  btn.title = `Hold for ${ms / 1000} second${ms > 1000 ? 's' : ''} to ${label.toLowerCase()}`;
  btn.setAttribute('aria-label', `${label} — hold ${ms / 1000}s`);
  btn.innerHTML = `<span class="hold-label">${label}</span><span class="hold-track" aria-hidden="true"><span class="hold-fill"></span></span>`;
  makeHoldable(btn, ms, action);
  return btn;
}

/* ---------- Shared header/footer injection ---------- */

function injectHeader(config = {}) {
  const {
    title = 'The Learning Toolshed',
    subtitle = 'Toolshed',
    brandHref = 'index.html',
    showSoundBtn = true,
    showSettingsBtn = true,
    showHomeBtn = true,
    homeUrl = 'https://swankymcgee.github.io/',
    tools = [],
    activeTool = null,
    onSoundToggle = null,
    onSettingsOpen = null
  } = config;

  const head = document.querySelector('header.site-head') || document.querySelector('header.app-header');
  if (!head) return;

  /* Clear existing dynamic content (keep static brand if present) */
  const existingBrand = head.querySelector('.brand');
  const existingTools = head.querySelector('.header-tools, .site-nav');
  if (existingBrand && !existingBrand.querySelector('h1')) existingBrand.remove();
  if (existingTools) existingTools.remove();

  /* Brand */
  let brand = head.querySelector('.brand');
  if (!brand) {
    brand = document.createElement('div');
    brand.className = 'brand';
    head.insertBefore(brand, head.firstChild);
  }
  brand.innerHTML = `<h1>${title}</h1><span class="brand-sub">· ${subtitle}</span>`;
  const brandLink = document.createElement('a');
  brandLink.href = brandHref;
  brandLink.className = 'brand-link';
  brandLink.title = `Back to ${title}`;
  brandLink.append(...brand.childNodes);
  brand.appendChild(brandLink);

  /* Tool nav + controls */
  const toolsDiv = document.createElement('div');
  toolsDiv.className = 'header-tools';

  if (tools.length) {
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Tools');
    for (const t of tools) {
      const a = document.createElement('a');
      a.href = t.href;
      a.textContent = t.name;
      a.setAttribute('aria-current', t.id === activeTool ? 'page' : 'false');
      nav.appendChild(a);
    }
    toolsDiv.appendChild(nav);
  }

  const controls = document.createElement('div');
  controls.className = 'header-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Settings');

  if (showSoundBtn && onSoundToggle) {
    controls.appendChild(makeHoldBtn('sound', 'Sound', 1000, onSoundToggle));
  }
  if (showSettingsBtn && onSettingsOpen) {
    controls.appendChild(makeHoldBtn('settings', 'Settings', 3000, onSettingsOpen));
  }
  if (showHomeBtn) {
    controls.appendChild(makeHoldBtn('home', 'Home', 1000, () => { window.location.href = homeUrl; }));
  }

  toolsDiv.appendChild(controls);
  head.appendChild(toolsDiv);
}

function injectFooter(config = {}) {
  const { homeUrl = 'https://swankymcgee.github.io/', homeText = 'The Learning Toolshed' } = config;
  let foot = document.querySelector('footer.site-foot, footer.app-foot');
  if (!foot) {
    foot = document.createElement('footer');
    foot.className = 'site-foot';
    document.body.appendChild(foot);
  }
  foot.innerHTML = `<a href="${homeUrl}">${homeText}</a> · Staff resources for The Learning Toolshed`;
}

/* ---------- One-call initialization ---------- */

function initCommon(headerConfig = {}, footerConfig = {}) {
  /* Apply theme before first paint (caller should have called this inline) */
  applyTheme(readTheme());
  syncMotifs();

  /* Inject shared chrome */
  injectHeader(headerConfig);
  injectFooter(footerConfig);

  /* Cross-tab sync for theme changes */
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      applyTheme(readTheme());
      syncMotifs();
    }
  });

  /* Palette picker delegation (if present) */
  const panel = document.getElementById('themePanel');
  if (panel) {
    panel.addEventListener('click', (e) => {
      const row = e.target.closest('.theme-opt');
      if (row) {
        const id = row.dataset.theme;
        writeTheme(id);
        applyTheme(id);
        const wrap = document.getElementById('themeWrap');
        if (wrap) wrap.querySelector('.theme-btn')?.click();
      }
    });
  }

  /* Motif toggle delegation */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#motifBtn');
    if (btn) {
      patchSettings({ homeMotifs: !motifsOn() });
      syncMotifs();
    }
  });
}

/* ---------- Export for ES modules / global ---------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { THEMES, STORAGE_KEY, readTheme, patchSettings, writeTheme, motifsOn, syncMotifs, applyTheme, syncPicker, makeHoldable, makeHoldBtn, injectHeader, injectFooter, initCommon };
} else {
  window.ToolshedCommon = { THEMES, STORAGE_KEY, readTheme, patchSettings, writeTheme, motifsOn, syncMotifs, applyTheme, syncPicker, makeHoldable, makeHoldBtn, injectHeader, injectFooter, initCommon };
}