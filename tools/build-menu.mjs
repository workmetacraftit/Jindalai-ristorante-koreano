#!/usr/bin/env node
// Genera il menu dentro menu/index.html a partire da data/menu.json e data/photos.json:
// l'elenco dei piatti con le foto, la barra delle sezioni, la legenda degli allergeni,
// i crediti delle foto e i dati strutturati per i motori di ricerca.
//
// Uso:  node tools/build-menu.mjs
//
// Il resto di menu/index.html (testata, testi, piè di pagina) si modifica a mano: lo script
// riscrive solo ciò che sta tra i commenti <!-- MENU…:START --> e <!-- MENU…:END -->.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagePath = join(root, 'menu', 'index.html');
const data = JSON.parse(readFileSync(join(root, 'data', 'menu.json'), 'utf8'));
const photos = JSON.parse(readFileSync(join(root, 'data', 'photos.json'), 'utf8'));
let page = readFileSync(pagePath, 'utf8');

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const PHOTO_DIR = '/assets/img/menu/';
const PHOTO_SIZES = [200, 400]; // larghezze delle miniature; la versione grande (-800) si apre al tocco
const showPrices = data.showPrices !== false;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const euro = (n) => '€ ' + n.toFixed(2).replace('.', ',');
const fail = (msg) => { console.error('Errore nei dati del menu: ' + msg); process.exit(1); };

// L'indirizzo del sito si legge dal canonical della pagina, così resta scritto in un posto solo
const canonical = (page.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
if (!canonical || !canonical.endsWith('/menu/')) fail('canonical non trovato in menu/index.html');
const SITE = canonical.slice(0, -'/menu/'.length);

/* ---------- controlli ---------- */
const ids = new Set();
const used = new Map(); // foto → primo piatto che la usa
let total = 0;
for (const g of data.groups) {
  for (const s of g.sections) {
    if (ids.has(s.id)) fail(`id di sezione ripetuto: ${s.id}`);
    ids.add(s.id);
    for (const a of s.allergens || []) if (!data.allergens[a]) fail(`allergene sconosciuto "${a}" nella sezione ${s.id}`);
    for (const it of s.items) {
      total++;
      if (!it.name) fail(`voce senza nome nella sezione ${s.id}`);
      const prices = it.prices ? it.prices.map((p) => p.price) : [it.price];
      if (!prices.length || prices.some((p) => typeof p !== 'number' || !(p > 0))) fail(`prezzo mancante o non valido: ${it.name}`);
      for (const a of it.allergens || []) if (!data.allergens[a]) fail(`allergene sconosciuto "${a}": ${it.name}`);
      if (it.photo) {
        const ph = photos[it.photo];
        if (!ph) fail(`la foto "${it.photo}" di «${it.name}» non è descritta in data/photos.json`);
        for (const w of [...PHOTO_SIZES, 800]) for (const ext of ['avif', 'webp']) {
          if (!existsSync(join(root, 'assets', 'img', 'menu', `${it.photo}-${w}.${ext}`))) fail(`manca il file assets/img/menu/${it.photo}-${w}.${ext}`);
        }
        if (ph.source === 'commons' && !(ph.author && ph.license && ph.url)) fail(`foto "${it.photo}": servono autore, licenza e indirizzo della fonte`);
        if (used.has(it.photo)) fail(`la foto "${it.photo}" è usata due volte: «${used.get(it.photo)}» e «${it.name}»`);
        used.set(it.photo, it.name);
      }
    }
  }
}

/* ---------- pezzi di pagina ---------- */
const allergenNames = (codes) => codes.map((c) => data.allergens[c].short);

function original(it) {
  const parts = [];
  if (it.ko) parts.push(`<span lang="ko">${esc(it.ko)}</span>`);
  if (it.zh) parts.push(`<span lang="zh-Hans">${esc(it.zh)}</span>`);
  return parts.join('<span aria-hidden="true"> · </span>');
}

function picture(it) {
  const ph = photos[it.photo];
  const set = (ext) => PHOTO_SIZES.map((w) => `${PHOTO_DIR}${it.photo}-${w}.${ext} ${w}w`).join(', ');
  const sizes = '(min-width: 700px) 128px, 104px';
  const credit = ph.source === 'commons' ? ` data-credit="${esc(`Foto: ${ph.author}, ${ph.license}`)}"` : '';
  // Il link porta alla foto grande anche senza JavaScript; con JavaScript si apre in una finestra sulla pagina
  return [
    `            <a class="mi__pic" href="${PHOTO_DIR}${it.photo}-800.webp" data-zoom="${esc(it.name)}"${credit}>`,
    '              <picture>',
    `                <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`,
    `                <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`,
    `                <img src="${PHOTO_DIR}${it.photo}-400.webp" width="400" height="400" loading="lazy" decoding="async" alt="${esc(ph.alt || it.name)}">`,
    '              </picture>',
    `              <span class="vh">Ingrandisci la foto</span>`,
    '            </a>'
  ].join('\n');
}

function item(it) {
  const num = it.n ? `<span class="mi__n"><span class="vh">Numero </span>${it.n}</span> ` : '';
  const tags = [];
  if (it.spicy) tags.push('<span class="tag tag--hot">Piccante</span>');
  for (const name of allergenNames(it.allergens || [])) tags.push(`<span class="tag">${esc(name)}</span>`);
  if (it.frozen) tags.push('<span class="tag tag--ice">Surgelato</span>');
  const orig = original(it);
  const price = showPrices
    ? `<span class="mi__dots" aria-hidden="true"></span><span class="mi__price">${it.prices ? it.prices.map((p) => euro(p.price)).join(' / ') : euro(it.price)}</span>`
    : '';
  return [
    `          <li class="mi${it.photo ? ' mi--pic' : ''}">`,
    '            <div class="mi__txt">',
    `              <p class="mi__row"><span class="mi__name">${num}${esc(it.name)}</span>${price}</p>`,
    orig ? `              <p class="mi__orig">${orig}</p>` : '',
    it.desc ? `              <p class="mi__desc">${esc(it.desc)}</p>` : '',
    // la virgola nascosta serve a chi ascolta la pagina con un lettore di schermo: senza, le etichette verrebbero lette attaccate
    tags.length ? `              <p class="mi__tags"><span class="vh">Note: </span>${tags.join('<span class="vh">, </span>')}</p>` : '',
    '            </div>',
    it.photo ? picture(it) : '',
    '          </li>'
  ].filter(Boolean).join('\n');
}

function section(s) {
  const orig = original(s);
  const meta = [];
  if (s.allergens && s.allergens.length) meta.push('Allergeni: ' + allergenNames(s.allergens).map((n) => n.toLowerCase()).join(', ') + '.');
  if (s.frozen) meta.push('Ingredienti surgelati.');
  return [
    `      <section class="msec" id="${s.id}" aria-labelledby="h-${s.id}">`,
    '        <header class="msec__head">',
    `          <h3 id="h-${s.id}">${esc(s.title)}${orig ? ` <span class="msec__orig">${orig}</span>` : ''}</h3>`,
    meta.length ? `          <p class="msec__meta">${esc(meta.join(' '))}</p>` : '',
    '        </header>',
    '        <ul class="mlist">',
    s.items.map(item).join('\n'),
    '        </ul>',
    '      </section>'
  ].filter(Boolean).join('\n');
}

const menuHtml = data.groups.map((g) => [
  `    <section class="mgroup" id="g-${g.id}" aria-labelledby="hg-${g.id}">`,
  '      <header class="mgroup__head">',
  `        <h2 id="hg-${g.id}">${esc(g.title)}</h2>`,
  g.intro ? `        <p>${esc(g.intro)}</p>` : '',
  '      </header>',
  g.sections.map(section).join('\n'),
  '    </section>'
].filter(Boolean).join('\n')).join('\n\n');

const navHtml = [
  '  <nav class="cats" aria-label="Sezioni del menu">',
  '    <div class="cats__in">',
  data.groups.map((g) => [
    `      <p class="cats__g">${esc(g.title)}</p>`,
    '      <ul>',
    g.sections.filter((s) => s.nav !== false).map((s) => `        <li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('\n'),
    '      </ul>'
  ].join('\n')).join('\n'),
  '    </div>',
  '  </nav>'
].join('\n');

const algHtml = [
  '      <ul class="alg__list">',
  Object.entries(data.allergens).map(([code, a]) => `        <li><b>${code}</b><span>${esc(a.long)}</span></li>`).join('\n'),
  '      </ul>'
].join('\n');

const [year, month] = data.updated.split('-').map(Number);
const dateHtml = `${MESI[month - 1]} ${year}`;

/* ---------- foto: avviso e crediti ---------- */
// Le foto prese da archivi liberi non ritraggono i piatti del ristorante: va detto, e gli autori vanno citati.
const stock = [...used.keys()].filter((id) => photos[id].source === 'commons');
const noteHtml = stock.length ? 'Le foto contrassegnate nei <a href="#crediti">crediti</a> sono indicative: il piatto servito può presentarsi diversamente.' : '';
const creditsHtml = !stock.length ? '' : [
  '    <section class="credits" id="crediti" aria-labelledby="h-crediti">',
  '      <h2 id="h-crediti">Crediti fotografici</h2>',
  `      <p>Alcune foto del menu vengono da Wikimedia Commons e sono pubblicate con licenza libera. Sono state ritagliate e ridimensionate. Mostrano il piatto in generale, non la preparazione del ristorante.</p>`,
  '      <details>',
  `        <summary>Autori e licenze delle ${stock.length} foto</summary>`,
  '        <ul class="credits__list">',
  stock.map((id) => {
    const ph = photos[id];
    const lic = ph.licenseUrl ? `<a href="${esc(ph.licenseUrl)}" rel="license noopener">${esc(ph.license)}</a>` : esc(ph.license);
    return `          <li><b>${esc(used.get(id))}</b>: <a href="${esc(ph.url)}" rel="noopener">«${esc(ph.title)}»</a> di ${esc(ph.author)}, ${lic}.</li>`;
  }).join('\n'),
  '        </ul>',
  '      </details>',
  '    </section>'
].join('\n');

/* ---------- dati strutturati (schema.org) ---------- */
const offer = (price, name) => ({ '@type': 'Offer', ...(name ? { name } : {}), price: price.toFixed(2), priceCurrency: data.currency });
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Restaurant', '@id': SITE + '/#ristorante', name: 'Jindalai Ristorante', url: SITE + '/', hasMenu: { '@id': SITE + '/menu/#menu' } },
    {
      '@type': 'Menu', '@id': SITE + '/menu/#menu', name: 'Menu di Jindalai', url: SITE + '/menu/', inLanguage: 'it',
      hasMenuSection: data.groups.map((g) => ({
        '@type': 'MenuSection', name: g.title,
        hasMenuSection: g.sections.map((s) => ({
          '@type': 'MenuSection', name: s.title,
          hasMenuItem: s.items.map((it) => ({
            '@type': 'MenuItem', name: it.name,
            ...(it.ko || it.zh ? { alternateName: [it.ko, it.zh].filter(Boolean) } : {}),
            ...(it.desc ? { description: it.desc } : {}),
            // solo le foto del ristorante: quelle d'archivio non ritraggono il piatto servito
            ...(it.photo && photos[it.photo].source !== 'commons' ? { image: `${SITE}${PHOTO_DIR}${it.photo}-800.webp` } : {}),
            ...(showPrices ? { offers: it.prices ? it.prices.map((p) => offer(p.price, p.label)) : offer(it.price) } : {})
          }))
        }))
      }))
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Menu', item: SITE + '/menu/' }
      ]
    }
  ]
};
const ldHtml = '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>';

/* ---------- scrittura ---------- */
function put(marker, html, inline) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const a = page.indexOf(start);
  const b = page.indexOf(end);
  if (a < 0 || b < a) fail(`commenti ${marker} non trovati in menu/index.html`);
  page = page.slice(0, a + start.length) + (inline || !html ? html : '\n' + html + '\n') + page.slice(b);
}
put('MENU-LD', ldHtml);
put('MENU-NAV', navHtml);
put('MENU', menuHtml);
put('MENU-ALG', algHtml);
put('MENU-CREDITS', creditsHtml || '\n');
put('MENU-DATE', dateHtml, true);
put('MENU-PHOTONOTE', noteHtml, true);
writeFileSync(pagePath, page);
console.log(`menu/index.html aggiornato: ${total} voci in ${ids.size} sezioni, ${used.size} con foto (${stock.length} da archivi liberi), prezzi ${showPrices ? 'visibili' : 'nascosti'}.`);

/* ---------- controllo: testata e piè di pagina uguali nelle tre pagine ---------- */
const block = (html, open, close) => {
  const a = html.indexOf(open);
  const b = html.indexOf(close, a);
  return a < 0 || b < 0 ? null : html.slice(a, b + close.length).replace(/ aria-current="page"/g, '');
};
const pages = ['index.html', 'menu/index.html', 'storia/index.html'].map((p) => [p, readFileSync(join(root, p), 'utf8')]);
for (const [name, open, close] of [['La testata', '<header class="top"', '</header>'], ['Il piè di pagina', '<footer class="foot"', '</footer>']]) {
  const blocks = pages.map(([p, html]) => [p, block(html, open, close)]);
  const different = blocks.filter(([, b]) => b !== blocks[0][1]).map(([p]) => p);
  if (different.length) console.warn(`Attenzione: ${name.toLowerCase()} di ${different.join(', ')} è diverso da quello di index.html.`);
}
