import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELS, SOURCES } from '../../src/levels.js';

const CODES = ['en', 'az', 'de', 'ru'];

async function freshI18n(search = '') {
  vi.resetModules();
  window.history.replaceState(null, '', `/${search}`);
  return import('../../src/i18n.js');
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('languages', () => {
  it('offers EN, AZ, DE, RU in this order and defaults to English', async () => {
    const i18n = await freshI18n();
    expect(i18n.LANGS.map((l) => l.code)).toEqual(CODES);
    expect(i18n.getLang()).toBe('en');
    expect(i18n.t('title')).toBe('Qubit Descent');
  });

  it('reads the language from ?lang= and from storage', async () => {
    expect((await freshI18n('?lang=de')).getLang()).toBe('de');
    localStorage.setItem('qubit-descent-lang', 'az');
    expect((await freshI18n()).getLang()).toBe('az');
    expect((await freshI18n('?lang=xx')).getLang()).toBe('az'); // unknown code ignored
  });
});

describe('dictionaries are complete', () => {
  it('every UI key exists in every language with the same kind of value', async () => {
    const { DICTIONARIES } = await freshI18n();
    const keys = Object.keys(DICTIONARIES.UI.en);
    for (const code of CODES) {
      expect(Object.keys(DICTIONARIES.UI[code]).sort()).toEqual([...keys].sort());
      for (const k of keys) {
        const v = DICTIONARIES.UI[code][k];
        expect(typeof v, `${code}.${k}`).toBe(typeof DICTIONARIES.UI.en[k]);
        if (typeof v === 'function') expect(String(v('42', '7'))).toContain('42');
        else expect(v.length, `${code}.${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('every level has a name, description and fabrication text in every language', async () => {
    const { DICTIONARIES } = await freshI18n();
    for (const level of LEVELS) {
      const tr = DICTIONARIES.LEVEL_TEXT[level.id];
      expect(tr, level.id).toBeDefined();
      for (const code of CODES) {
        const [name, text, fab] = tr[code];
        expect(name.length).toBeGreaterThan(3);
        expect(text.length).toBeGreaterThan(60);
        // fabrication text is either present everywhere or nowhere for a level
        expect(fab === null, `${level.id}.${code}`).toBe(tr.en[2] === null);
        if (fab) expect(fab.length).toBeGreaterThan(40);
        if (code !== 'en') expect(text, `${level.id}.${code}`).not.toBe(tr.en[1]);
      }
    }
  });

  it('only the fridge has no fabrication step', async () => {
    const { DICTIONARIES } = await freshI18n();
    const without = LEVELS.filter((l) => DICTIONARIES.LEVEL_TEXT[l.id].en[2] === null).map((l) => l.id);
    expect(without).toEqual(['fridge']);
  });

  it('every fact label is translated', async () => {
    const { DICTIONARIES } = await freshI18n();
    for (const level of LEVELS)
      for (const [key] of level.facts) for (const code of CODES) expect(DICTIONARIES.UI[code][key], `${code}.${key}`).toBeTruthy();
  });
});

describe('levels and sources', () => {
  it('every level cites at least one known source, and every source is used', () => {
    const used = new Set();
    for (const level of LEVELS) {
      expect(level.sources.length, level.id).toBeGreaterThan(0);
      for (const id of level.sources) {
        expect(SOURCES[id], `${level.id} → ${id}`).toBeDefined();
        used.add(id);
      }
    }
    expect([...used].sort()).toEqual(Object.keys(SOURCES).sort());
  });

  it('source links are https, DOIs go through doi.org', () => {
    for (const [id, s] of Object.entries(SOURCES)) {
      expect(s.url, id).toMatch(/^https:\/\//);
      if (s.url.includes('10.')) expect(s.url, id).toMatch(/^https:\/\/doi\.org\/10\.\d{4,}\//);
    }
  });

  it('level ids are unique and spans shrink monotonically', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].span).toBeLessThan(LEVELS[i - 1].span);
  });
});

describe('formatting and switching', () => {
  it('uses a decimal point in English and a comma elsewhere', async () => {
    const i18n = await freshI18n();
    expect(i18n.fmtDecimal('0.143 %')).toBe('0.143 %');
    i18n.setLang('az');
    expect(i18n.fmtDecimal('0.143 %')).toBe('0,143 %');
    expect(i18n.fmtDecimal('0.01–0.16 µm²')).toBe('0,01–0,16 µm²');
    expect(i18n.fmtDecimal('Al / AlOx / Al')).toBe('Al / AlOx / Al');
  });

  it('setLang notifies listeners, persists and updates the URL', async () => {
    const i18n = await freshI18n();
    const seen = [];
    i18n.onLangChange((c) => seen.push(c));
    i18n.setLang('ru');
    i18n.setLang('ru'); // no duplicate notification
    i18n.setLang('zz'); // ignored
    expect(seen).toEqual(['ru']);
    expect(localStorage.getItem('qubit-descent-lang')).toBe('ru');
    expect(new URL(window.location.href).searchParams.get('lang')).toBe('ru');
    expect(i18n.levelText('atom').name).toBe('Один атом фосфора');
  });

  it('translateDom fills text, titles and the document language', async () => {
    const i18n = await freshI18n();
    document.body.innerHTML = `
      <h2 data-i18n="howMade"></h2>
      <button data-i18n-title="next"></button>`;
    i18n.setLang('de');
    i18n.translateDom();
    expect(document.querySelector('h2').textContent).toBe('So wird es hergestellt');
    const btn = document.querySelector('button');
    expect(btn.title).toBe('Nächste Ebene (↓)');
    expect(btn.getAttribute('aria-label')).toBe(btn.title);
    expect(document.documentElement.lang).toBe('de');
    expect(document.title).toContain('Quantencomputer');
  });

  it('falls back to English, then to the key itself', async () => {
    const i18n = await freshI18n();
    expect(i18n.t('does-not-exist')).toBe('does-not-exist');
    expect(i18n.levelText('nowhere').name).toBe('nowhere');
  });
});
