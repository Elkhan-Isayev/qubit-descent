import { loadChip } from './data.js';
import { LEVELS, SOURCES } from './levels.js';
import { LANGS, fmtDecimal, getLang, levelText, onLangChange, setLang, t, translateDom } from './i18n.js';
import { DescentScene } from './scene.js';
import { clamp, formatLength, levelAt, levelProgress, spanAt, stepLevel } from './zoom.js';

const $ = (id) => document.getElementById(id);

// Scroll sensitivity: one level per ~600 px of wheel travel.
const WHEEL_PER_LEVEL = 600;
const SMOOTHING = 6; // 1/s, exponential approach of progress to its target

const state = {
  progress: 0,
  target: 0,
  level: -1,
};

function buildLangSwitcher() {
  const nav = $('lang');
  for (const l of LANGS) {
    const b = document.createElement('button');
    b.textContent = l.label;
    b.title = l.name;
    b.dataset.lang = l.code;
    b.addEventListener('click', () => setLang(l.code));
    nav.appendChild(b);
  }
  const mark = () => nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.lang === getLang()));
  mark();
  onLangChange(mark);
}

function buildRuler() {
  const track = $('ruler');
  LEVELS.forEach((level, i) => {
    const b = document.createElement('button');
    b.className = 'tick';
    b.style.top = `${levelProgress(i) * 100}%`;
    const { value, unit } = formatLength(level.span);
    b.innerHTML = `<i></i><span>${value} ${unit}</span>`;
    b.addEventListener('click', () => (state.target = levelProgress(i)));
    track.appendChild(b);
  });
}

function renderCredits() {
  const list = $('credits-list');
  list.innerHTML = '';
  for (const s of Object.values(SOURCES)) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`;
    list.appendChild(li);
  }
}

function renderCard(i, animate) {
  const level = LEVELS[i];
  const fill = () => {
    const { name, text, fab } = levelText(level.id);
    $('card-level').textContent = t('levelOf')(i + 1, LEVELS.length);
    $('card-title').textContent = name;
    $('card-text').textContent = text;
    $('card-fab').classList.toggle('none', !fab);
    $('card-fab-text').textContent = fab ?? '';
    $('card-facts').innerHTML = level.facts.map(([k, v]) => `<dt>${t(k)}</dt><dd>${fmtDecimal(v)}</dd>`).join('');
    $('card-sources').innerHTML = level.sources
      .map((id) => `<a href="${SOURCES[id].url}" target="_blank" rel="noopener">${SOURCES[id].label}</a>`)
      .join('');
    $('btn-prev').disabled = i === 0;
    $('btn-next').disabled = i === LEVELS.length - 1;
    document.querySelectorAll('.tick').forEach((el, k) => el.classList.toggle('on', k === i));
  };
  if (!animate) return fill();
  const card = $('card');
  card.classList.add('swap');
  setTimeout(() => {
    fill();
    card.classList.remove('swap');
  }, 220);
}

function bindInput(canvas) {
  const nudge = (dp) => (state.target = clamp(state.target + dp));
  const perPixel = 1 / (WHEEL_PER_LEVEL * (LEVELS.length - 1));

  window.addEventListener(
    'wheel',
    (e) => {
      if ($('credits').classList.contains('hidden') === false) return;
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      nudge(px * perPixel);
    },
    { passive: false },
  );

  let touchY = null;
  canvas.addEventListener('touchstart', (e) => (touchY = e.touches[0].clientY), { passive: true });
  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      nudge((touchY - y) * perPixel * 2.5);
      touchY = y;
    },
    { passive: true },
  );
  canvas.addEventListener('touchend', () => (touchY = null));

  const go = (dir) => (state.target = stepLevel(state.target, dir));
  $('btn-prev').addEventListener('click', () => go(-1));
  $('btn-next').addEventListener('click', () => go(1));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return toggleCredits(false);
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) go(1);
    else if (['ArrowUp', 'PageUp'].includes(e.key)) go(-1);
    else if (e.key === 'Home') state.target = 0;
    else if (e.key === 'End') state.target = 1;
    else return;
    e.preventDefault();
  });

  $('btn-credits').addEventListener('click', () => toggleCredits(true));
  $('credits-close').addEventListener('click', () => toggleCredits(false));
  $('credits').addEventListener('click', (e) => e.target === $('credits') && toggleCredits(false));
}

function toggleCredits(open) {
  $('credits').classList.toggle('hidden', !open);
}

// Labels pinned to 3D points (e.g. the fridge stages): created on first use, re-translated on language change.
const labelEls = new Map();
function renderLabels(labels) {
  for (const l of labels) {
    let el = labelEls.get(l.key);
    if (!el) {
      el = document.createElement('div');
      el.className = 'label3d';
      $('labels').appendChild(el);
      labelEls.set(l.key, el);
    }
    const html = `<span>${t(l.key)}</span><b>${fmtDecimal(l.text)}</b>`;
    if (el.dataset.html !== html) el.innerHTML = el.dataset.html = html;
    el.style.opacity = l.opacity;
    el.style.transform = l.opacity > 0.01 ? `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px) translateY(-50%)` : 'translate(-9999px, 0)';
  }
}

function updateHud() {
  const { value, unit } = formatLength(spanAt(state.progress));
  $('scale-value').textContent = fmtDecimal(value);
  $('scale-unit').textContent = unit;
  $('ruler-head').style.top = `${state.progress * 100}%`;
  const i = levelAt(state.progress);
  if (i !== state.level) {
    renderCard(i, state.level !== -1);
    state.level = i;
  }
}

async function main() {
  buildLangSwitcher();
  translateDom();
  buildRuler();
  renderCredits();
  onLangChange(() => {
    translateDom();
    renderCard(state.level, false);
    updateHud();
  });

  const chip = await loadChip();
  const scene = new DescentScene($('scene'), chip);
  if (!scene.renderer.capabilities.isWebGL2) throw new Error(t('webgl2'));
  if (import.meta.env.DEV) window.__descent = { scene, state };
  window.addEventListener('resize', () => scene.resize());
  bindInput($('scene'));

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    state.progress += (state.target - state.progress) * (1 - Math.exp(-SMOOTHING * dt));
    if (Math.abs(state.target - state.progress) < 1e-5) state.progress = state.target;
    scene.update(state.progress, dt);
    renderLabels(scene.labels());
    updateHud();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  $('loader').classList.add('hidden');
  for (const id of ['hud', 'card', 'ruler', 'nav']) $(id).classList.remove('hidden');
}

main().catch((err) => {
  console.error(err);
  document.querySelector('.loader-sub').textContent = `${t('error')}: ${err.message}`;
});
