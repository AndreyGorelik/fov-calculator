// Builds one static page per language from src/template.html and src/i18n/<code>.json.
// Run: node build.mjs   (no dependencies)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://andreygorelik.github.io';
const BASE = '/fov-calculator/';

const LATIN = {
  href: 'family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;1,600;1,700;1,800',
  stack: '"Barlow Condensed", "Arial Narrow", sans-serif',
};
const CYRILLIC = {
  href: 'family=Roboto+Condensed:ital,wght@0,400;0,500;0,600;0,700;1,600;1,700;1,800',
  stack: '"Roboto Condensed", "Arial Narrow", sans-serif',
};
// Latin letters and digits stay in Barlow; the script's own characters come from Noto.
function withNoto(family) {
  return {
    href: LATIN.href + '&family=' + family.replace(/ /g, '+') + ':wght@400;500;700',
    stack: `"Barlow Condensed", "${family}", sans-serif`,
  };
}

// Order here is the order of the language switcher.
const LANGS = [
  { code: 'en', html: 'en', label: 'EN', font: LATIN },
  { code: 'de', html: 'de', label: 'DE', font: LATIN },
  { code: 'es', html: 'es', label: 'ES', font: LATIN },
  { code: 'fr', html: 'fr', label: 'FR', font: LATIN },
  { code: 'it', html: 'it', label: 'IT', font: LATIN },
  { code: 'pt', html: 'pt-BR', label: 'PT', font: LATIN },
  { code: 'pl', html: 'pl', label: 'PL', font: LATIN },
  { code: 'tr', html: 'tr', label: 'TR', font: LATIN },
  { code: 'ru', html: 'ru', label: 'RU', font: CYRILLIC },
  { code: 'zh', html: 'zh-Hans', label: '中文', font: withNoto('Noto Sans SC') },
  { code: 'ja', html: 'ja', label: '日本語', font: withNoto('Noto Sans JP') },
  { code: 'ko', html: 'ko', label: '한국어', font: withNoto('Noto Sans KR') },
  { code: 'th', html: 'th', label: 'ไทย', font: withNoto('Noto Sans Thai') },
];

// Strings the page script needs at runtime.
const JS_KEYS = [
  'tagRadians', 'tagSteps', 'tagMultiplier', 'tagAngle', 'tripleAngle', 'widthBezels', 'noMatch',
  'copied', 'copyManual', 'sideAngled', 'curvedShort', 'flat', 'cm', 'screenWidth',
];

const template = readFileSync('src/template.html', 'utf8');
const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8'));

function pathOf(lang) {
  return lang.code === 'en' ? BASE : BASE + lang.code + '/';
}

function urlOf(lang) {
  return SITE + pathOf(lang);
}

function plain(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

function scriptJson(value) {
  return JSON.stringify(value, null, 2).replace(/<\//g, '<\\/');
}

const hreflang = LANGS.map((l) => `<link rel="alternate" hreflang="${l.html}" href="${urlOf(l)}">`)
  .concat(`<link rel="alternate" hreflang="x-default" href="${urlOf(LANGS[0])}">`)
  .join('\n');

function langNav(current, t) {
  const links = LANGS.map((l) => {
    const active = l.code === current.code ? ' aria-current="page"' : '';
    const name = loadStrings(l).langName;
    return `<a href="${pathOf(l)}" hreflang="${l.html}" lang="${l.html}" title="${name}"${active}>${l.label}</a>`;
  });
  return `<nav class="langs" aria-label="${t.langNavAria}">${links.join('')}</nav>`;
}

function jsonLd(lang, t) {
  const app = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: plain(t.ogTitle),
    url: urlOf(lang),
    inLanguage: lang.html,
    description: plain(t.appDescription),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang.html,
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      '@type': 'Question',
      name: plain(t['q' + i]),
      acceptedAnswer: { '@type': 'Answer', text: plain(t['a' + i]) },
    })),
  };
  return [app, faq].map((o) => `<script type="application/ld+json">\n${scriptJson(o)}\n</script>`).join('\n');
}

const cache = {};
function loadStrings(lang) {
  if (!cache[lang.code]) {
    const own = lang.code === 'en' ? {} : JSON.parse(readFileSync(`src/i18n/${lang.code}.json`, 'utf8'));
    cache[lang.code] = { ...en, ...own };
  }
  return cache[lang.code];
}

function render(lang) {
  const t = loadStrings(lang);
  const values = {
    ...t,
    lang: lang.html,
    url: urlOf(lang),
    base: BASE,
    hreflang,
    langnav: langNav(lang, t),
    jsonld: jsonLd(lang, t),
    js: scriptJson(Object.fromEntries(JS_KEYS.map((k) => [k, plain(t[k])]))),
    fontsHref: `https://fonts.googleapis.com/css2?${lang.font.href}&display=swap`,
    fontStack: lang.font.stack,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`${lang.code}: missing string "${key}"`);
    return values[key];
  });
}

for (const lang of LANGS) {
  const dir = lang.code === 'en' ? '.' : lang.code;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, render(lang));
}

const today = new Date().toISOString().slice(0, 10);
const alternates = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.html}" href="${urlOf(l)}"/>`).join('\n');
const urls = LANGS.map((l) => `  <url>\n    <loc>${urlOf(l)}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`);
writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  urls.join('\n') + '\n</urlset>\n');

console.log('Built', LANGS.map((l) => l.code).join(', '));
