#!/usr/bin/env node
/**
 * Jumbo weekly-offers scraper.
 *
 * ⚠️  Jumbo has no public/sanctioned API. Scraping their website is against
 *     their Terms of Service, and the page structure can change at any time
 *     and break this script. Use for personal, low-volume use at your own
 *     risk — don't run it on a schedule that hammers their servers, and don't
 *     ship it in a public product.
 *
 * What it does:
 *   1. Opens https://www.jumbo.com/aanbiedingen/nu in a headless browser.
 *   2. Accepts the cookie banner and scrolls to load every offer tile.
 *   3. Reads the "Per gangpad" (per-aisle) sections. Each aisle is a
 *      <section class="category-section"> with an <h4 data-testid="category-title">
 *      heading and a grid of <article data-testid="promotion-card"> tiles.
 *   4. Normalizes them into the app's OfferProduct shape.
 *   5. Writes src/data/scrapedOffers.json, which the app prefers over its
 *      built-in mock data.
 *
 * Note on prices: the offers overview page only exposes the *promotion label*
 * ("2 voor 5,00", "voor 0,99", "25% korting", "1+1 gratis") — there is no
 * original/regular price on this page. So `discountLabel` always holds the real
 * offer text, and `regularPrice`/`offerPrice` are a best-effort parse (often
 * equal, meaning "no computable saving").
 *
 * Usage:
 *   node scraper/scrapeJumbo.mjs            # scrape + write scrapedOffers.json
 *   node scraper/scrapeJumbo.mjs --debug    # also dump raw HTML + a screenshot
 *   node scraper/scrapeJumbo.mjs --headed   # watch it run in a real window
 *   node scraper/scrapeJumbo.mjs --from-file ./page.html   # scrape a saved HTML
 *                                                          # file (offline; for
 *                                                          # testing selectors)
 *
 * Because this environment (and CI) can't reach jumbo.com, run it on a machine
 * with normal internet access. See scraper/README.md.
 */

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, isAbsolute } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OFFERS_URL = 'https://www.jumbo.com/aanbiedingen/nu';
const OUTPUT_FILE = resolve(REPO_ROOT, 'src/data/scrapedOffers.json');
const DEBUG_DIR = resolve(__dirname, 'debug');

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const DEBUG = flags.has('--debug');
const HEADED = flags.has('--headed');
const fromFileIdx = args.indexOf('--from-file');
const FROM_FILE = fromFileIdx !== -1 ? args[fromFileIdx + 1] : null;

// ---------------------------------------------------------------------------
// CONFIG — the parts most likely to need tweaking when Jumbo changes its HTML.
// If a run stops finding products, re-run with --debug, open
// scraper/debug/page.html, find the offer tiles, and update these selectors.
// ---------------------------------------------------------------------------
const SELECTORS = {
  section: 'section.category-section',
  sectionTitle: '[data-testid="category-title"], h4.category-heading',
  tile: 'article[data-testid="promotion-card"], article.card-promotion',
  title: '.title-link',
  image: 'img',
  link: '.title-link',
  tag: '.jum-tag',
  tagLower: '.lower',
};

// Emoji per Jumbo aisle, since the app UI shows an emoji (the real image URL is
// also stored on the offer as imageUrl for later use).
const AISLE_EMOJI = [
  [/aardappel|groente|fruit/i, '🥦'],
  [/vlees|vis|vega/i, '🥩'],
  [/brood|gebak|bakker/i, '🍞'],
  [/zuivel|boter|ei/i, '🧀'],
  [/vleeswaren|kaas|tapas/i, '🧀'],
  [/maaltijd|gemak/i, '🍽️'],
  [/conserven|soep|saus|oli/i, '🥫'],
  [/wereldkeuken|kruid|pasta|rijst/i, '🍝'],
  [/koek|snoep|chocolade|chips/i, '🍫'],
  [/koffie|thee/i, '☕'],
  [/frisdrank|sap/i, '🥤'],
  [/bier|wijn/i, '🍺'],
  [/diepvries/i, '🧊'],
  [/drogisterij|gezondheid/i, '🧴'],
  [/baby|kind/i, '🍼'],
  [/huishouden|dier/i, '🧽'],
];

function emojiForAisle(aisle) {
  for (const [re, emoji] of AISLE_EMOJI) {
    if (re.test(aisle || '')) return emoji;
  }
  return '🛒';
}

function log(...m) {
  console.log('[scrape]', ...m);
}

function slug(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/** Pull euro amounts out of a promo label like "2 voor 5,00" or "voor 0,99". */
export function parseAmounts(raw) {
  if (!raw) return [];
  const decimals = [...raw.matchAll(/(\d+)[.,](\d{2})\b/g)].map((m) => Number(`${m[1]}.${m[2]}`));
  return decimals.filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Turn a raw scraped tile into an OfferProduct. The Jumbo overview page gives
 * a promotion label but no regular price, so this keeps the label as
 * `discountLabel` and does a best-effort price parse:
 *   - "N voor T,TT"  -> offerPrice = T/N (per-unit),         regularPrice = offerPrice
 *   - "voor P,PP"    -> offerPrice = P,PP,                   regularPrice = offerPrice
 *   - "PP,PP per ..." -> offerPrice = first amount,          regularPrice = offerPrice
 *   - "25% korting"  -> offerPrice = 0 (unknown), label carries the discount
 *   - "1+1 gratis"   -> offerPrice = 0 (unknown), label carries the discount
 */
export function normalize(raw) {
  const promoText = (raw.promoText || '').replace(/\s+/g, ' ').trim();
  const amounts = parseAmounts(promoText);
  let offerPrice = 0;

  const multiBuy = promoText.match(/(\d+)\s*voor\s*€?\s*(\d+[.,]\d{2})/i);
  if (multiBuy) {
    const qty = Number(multiBuy[1]) || 1;
    const total = Number(multiBuy[2].replace(',', '.'));
    offerPrice = Math.round((total / qty) * 100) / 100;
  } else if (amounts.length >= 1) {
    // "voor 0,99" or "0,69 per 100 gram" — take the (single) listed price.
    offerPrice = amounts[0];
  }

  const aisle = (raw.category || '').trim() || 'Overig';

  return {
    id: raw.id || slug(raw.name) || `offer-${Math.random().toString(36).slice(2, 8)}`,
    name: (raw.name || '').trim() || 'Onbekend product',
    category: aisle,
    unit: (raw.unit || '').trim() || 'per stuk',
    regularPrice: offerPrice,
    offerPrice,
    discountLabel: promoText || 'Aanbieding',
    validFrom: raw.validFrom || '',
    validUntil: raw.validUntil || '',
    imageEmoji: emojiForAisle(aisle),
    ...(raw.imageUrl ? { imageUrl: raw.imageUrl } : {}),
    ...(raw.productUrl ? { productUrl: raw.productUrl } : {}),
  };
}

/**
 * DOM extraction: runs inside the page. Walks each aisle section and pulls the
 * offer tiles out of it, tagging each with the aisle name from the section
 * heading. Returns an array of raw offers (still strings, un-normalized).
 */
export async function extractFromDom(page, selectors) {
  return page.evaluate((sel) => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const results = [];
    const seen = new Set();

    const sections = Array.from(document.querySelectorAll(sel.section));
    for (const section of sections) {
      const heading = section.querySelector(sel.sectionTitle);
      const category = heading ? clean(heading.textContent) : '';
      // Skip the outer wrapper section (its heading is "Per gangpad"); only
      // inner sections carry a real aisle name and tiles.
      const tiles = Array.from(section.querySelectorAll(sel.tile));
      for (const tile of tiles) {
        const id = tile.getAttribute('id') || '';
        if (id && seen.has(id)) continue;
        if (id) seen.add(id);

        const linkEl = tile.querySelector(sel.link);
        const imgEl = tile.querySelector(sel.image);
        const tagEl = tile.querySelector(sel.tag);
        const lowerEl = tagEl ? tagEl.querySelector(sel.tagLower) : null;

        const name = clean(linkEl ? linkEl.textContent : imgEl ? imgEl.getAttribute('alt') : '');
        const promoText = clean(lowerEl ? lowerEl.textContent : tagEl ? tagEl.textContent : '');

        results.push({
          id,
          name,
          promoText,
          category,
          validFrom: tile.getAttribute('start-date') || '',
          validUntil: tile.getAttribute('expiration-date') || '',
          imageUrl: imgEl ? imgEl.getAttribute('src') || '' : '',
          productUrl: linkEl ? linkEl.getAttribute('href') || '' : '',
        });
      }
    }
    return results;
  }, selectors);
}

async function acceptCookies(page) {
  const candidates = [
    'button#onetrust-accept-btn-handler',
    'button:has-text("Accepteer")',
    'button:has-text("Akkoord")',
    'button:has-text("Alles accepteren")',
    '[data-testid="accept-all"]',
  ];
  for (const selector of candidates) {
    const button = page.locator(selector).first();
    if (await button.count().catch(() => 0)) {
      await button.click({ timeout: 3000 }).catch(() => {});
      log('accepted cookie banner via', selector);
      await page.waitForTimeout(500);
      return;
    }
  }
  log('no cookie banner found (may already be accepted)');
}

async function autoScroll(page) {
  let previousHeight = 0;
  for (let i = 0; i < 40; i++) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    if (height === previousHeight) break;
    previousHeight = height;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function main() {
  const target = FROM_FILE
    ? pathToFileURL(isAbsolute(FROM_FILE) ? FROM_FILE : resolve(process.cwd(), FROM_FILE)).href
    : OFFERS_URL;
  log(`opening ${target}`);

  const browser = await chromium.launch({
    headless: !HEADED,
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}),
  });
  const context = await browser.newContext({
    locale: 'nl-NL',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!FROM_FILE) {
      await acceptCookies(page);
      await page.waitForTimeout(1500);
      await autoScroll(page);
    }

    if (DEBUG) {
      await mkdir(DEBUG_DIR, { recursive: true });
      await writeFile(resolve(DEBUG_DIR, 'page.html'), await page.content());
      await page.screenshot({ path: resolve(DEBUG_DIR, 'page.png'), fullPage: true }).catch(() => {});
      log(`debug artifacts written to ${DEBUG_DIR}`);
    }

    const raw = await extractFromDom(page, SELECTORS);
    log(`extracted ${raw.length} tiles from the DOM`);

    const byId = new Map();
    for (const r of raw.filter((x) => x.name && x.name.length > 1)) {
      const offer = normalize(r);
      if (!byId.has(offer.id)) byId.set(offer.id, offer);
    }
    const offers = [...byId.values()];

    if (offers.length === 0) {
      log('⚠️  No offers extracted. Re-run with --debug and inspect');
      log('   scraper/debug/page.html to update the SELECTORS block.');
      process.exitCode = 1;
    }

    await writeFile(OUTPUT_FILE, JSON.stringify(offers, null, 2) + '\n');
    log(`wrote ${offers.length} offers to ${OUTPUT_FILE}`);
  } finally {
    await browser.close();
  }
}

// Only scrape when run directly (`node scraper/scrapeJumbo.mjs`), so tests can
// import the pure helpers above without launching a browser.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('[scrape] failed:', err.message);
    process.exit(1);
  });
}
