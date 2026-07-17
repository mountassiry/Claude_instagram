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
 *   3. Extracts each offer (name, prices, promotion text, image, link).
 *   4. Normalizes them into the app's OfferProduct shape.
 *   5. Writes src/data/scrapedOffers.json, which the app prefers over its
 *      built-in mock data.
 *
 * Usage:
 *   node scraper/scrapeJumbo.mjs            # scrape + write scrapedOffers.json
 *   node scraper/scrapeJumbo.mjs --debug    # also dump raw HTML, __NEXT_DATA__,
 *                                           # and a screenshot to scraper/debug/
 *   node scraper/scrapeJumbo.mjs --headed   # watch it run in a real window
 *
 * Because this environment (and CI) can't reach jumbo.com, run it on a machine
 * with normal internet access. See scraper/README.md.
 */

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OFFERS_URL = 'https://www.jumbo.com/aanbiedingen/nu';
const OUTPUT_FILE = resolve(REPO_ROOT, 'src/data/scrapedOffers.json');
const DEBUG_DIR = resolve(__dirname, 'debug');

const args = new Set(process.argv.slice(2));
const DEBUG = args.has('--debug');
const HEADED = args.has('--headed');

// ---------------------------------------------------------------------------
// CONFIG — the parts most likely to need tweaking when Jumbo changes its HTML.
// If the DOM strategy stops finding products, run with --debug, open
// scraper/debug/page.html, find the offer tiles, and update these selectors.
// ---------------------------------------------------------------------------
const SELECTORS = {
  // Candidate selectors for a single product/offer tile. The first one that
  // matches several elements wins.
  tile: [
    'article[data-jsku]',
    'article.product-container',
    '[data-testid="product-card"]',
    'article',
  ],
  name: ['[data-testid="product-title"]', '.name', 'h3', 'h2', 'a[title]'],
  price: ['[data-testid="product-price"]', '.price', '[class*="price"]'],
  promo: ['[data-testid="promotion"]', '.promotion', '[class*="promo"]', '[class*="tag"]'],
  image: ['img'],
  link: ['a[href]'],
};

// Map Jumbo's free-text categories onto the app's fixed ProductCategory union.
// Keywords match as the *start of a word* (see categoryFor), so 'kip' matches
// "kipfilet" but 'ui' does not match "fruit". This is best-effort — the app
// only uses the category to group offers, so an occasional miss is cosmetic.
const CATEGORY_KEYWORDS = {
  'Vlees & Vis': [
    'vlees', 'vis', 'kip', 'gehakt', 'zalm', 'garnal', 'spek', 'worst', 'ham', 'rund',
    'varken', 'schnitzel', 'burger', 'filet', 'haring', 'tonijn', 'kabeljauw', 'bacon',
  ],
  'Groente & Fruit': [
    'groente', 'fruit', 'aardappel', 'tomaat', 'salade', 'appel', 'banaan', 'paprika',
    'broccoli', 'bloemkool', 'wortel', 'komkommer', 'courgette', 'champignon', 'avocado',
    'citroen', 'peer', 'druif', 'sinaasappel', 'spinazie', 'ui', 'knoflook', 'prei', 'mango',
  ],
  'Zuivel & Eieren': [
    'zuivel', 'kaas', 'melk', 'yoghurt', 'boter', 'ei', 'eieren', 'room', 'slagroom',
    'kwark', 'vla', 'mozzarella', 'parmezaan', 'creme',
  ],
  'Broodbeleg & Bakkerij': [
    'brood', 'bakker', 'beleg', 'broodje', 'ciabatta', 'wrap', 'krentenbol', 'croissant',
    'bagel', 'tortilla', 'cracker', 'beschuit',
  ],
  'Pasta, Rijst & Wereldkeuken': [
    'pasta', 'rijst', 'noedel', 'wereld', 'wok', 'taco', 'kokos', 'curry', 'penne',
    'spaghetti', 'macaroni', 'basmati', 'noodle',
  ],
  'Kruiden & Sauzen': [
    'kruid', 'saus', 'olie', 'azijn', 'pesto', 'specerij', 'peper', 'zout', 'passata',
    'ketchup', 'mayonaise', 'mosterd', 'soja',
  ],
};
const DEFAULT_CATEGORY = 'Kruiden & Sauzen';

// A rough emoji per category, since the UI shows emoji not photos (the real
// image URL is still stored on the offer as imageUrl for later use).
const CATEGORY_EMOJI = {
  'Vlees & Vis': '🥩',
  'Groente & Fruit': '🥦',
  'Zuivel & Eieren': '🧀',
  'Broodbeleg & Bakkerij': '🍞',
  'Pasta, Rijst & Wereldkeuken': '🍝',
  'Kruiden & Sauzen': '🫙',
};

function log(...m) {
  console.log('[scrape]', ...m);
}

/** Best-effort week window (Mon–Sun) for offers that don't carry explicit dates. */
export function currentWeekRange(now = new Date()) {
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { validFrom: start.toISOString(), validUntil: end.toISOString() };
}

export function categoryFor(text) {
  const haystack = (text || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Match a keyword only at the start of a word, so 'kip' matches "kipfilet"
    // but 'ui' doesn't match "fruit".
    if (keywords.some((k) => new RegExp(`\\b${k}`, 'i').test(haystack))) return category;
  }
  return DEFAULT_CATEGORY;
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

/** Pull the first and (optional) second euro amount out of a price/promo blob. */
export function parsePrices(raw) {
  if (!raw) return {};
  const matches = [...raw.matchAll(/(\d+)[.,](\d{2})/g)].map(
    (m) => Number(`${m[1]}.${m[2]}`),
  );
  const wholeEuro = [...raw.matchAll(/(?:€|EUR)\s*(\d+)(?![.,]\d)/g)].map((m) => Number(m[1]));
  const all = [...matches, ...wholeEuro].filter((n) => Number.isFinite(n) && n > 0);
  return { amounts: all };
}

/**
 * Turn a raw scraped tile into an OfferProduct. Jumbo promotions come in many
 * shapes ("van €4.99 voor €3.99", "2 voor €3", "25% korting", "1+1 gratis"),
 * so this is best-effort: it always keeps the original promotion text as the
 * discountLabel, and derives regular/offer prices when it reasonably can.
 */
export function normalize(raw, week) {
  const promoText = (raw.promoText || '').replace(/\s+/g, ' ').trim();
  const priceText = (raw.priceText || '').replace(/\s+/g, ' ').trim();

  // Parse the shelf price and the promo text separately: a "2 voor €3" promo
  // total shouldn't be mistaken for the item's regular price.
  const shelfAmounts = parsePrices(priceText).amounts ?? [];
  const allAmounts = [...shelfAmounts, ...(parsePrices(promoText).amounts ?? [])];
  let regularPrice = 0;
  let offerPrice = 0;

  const percentMatch = promoText.match(/(\d{1,2})\s*%/);
  const multiBuyMatch = promoText.match(/(\d+)\s*(?:voor|halen.*betalen|=)\s*€?\s*(\d+[.,]?\d*)/i);

  if (multiBuyMatch) {
    const qty = Number(multiBuyMatch[1]) || 1;
    const total = Number(multiBuyMatch[2].replace(',', '.'));
    offerPrice = Math.round((total / qty) * 100) / 100;
    regularPrice = shelfAmounts.length ? Math.max(...shelfAmounts) : offerPrice;
  } else if (allAmounts.length >= 2) {
    const sorted = [...allAmounts].sort((a, b) => a - b);
    offerPrice = sorted[0];
    regularPrice = sorted[sorted.length - 1];
  } else if (allAmounts.length === 1) {
    offerPrice = allAmounts[0];
    if (percentMatch) {
      const pct = Number(percentMatch[1]);
      regularPrice = pct < 100 ? Math.round((offerPrice / (1 - pct / 100)) * 100) / 100 : offerPrice;
    } else {
      regularPrice = offerPrice;
    }
  }

  const category = categoryFor(`${raw.name} ${raw.category || ''}`);
  const discountLabel = promoText || (percentMatch ? `-${percentMatch[1]}%` : 'Aanbieding');

  return {
    id: raw.id || slug(raw.name) || `offer-${Math.random().toString(36).slice(2, 8)}`,
    name: raw.name?.trim() || 'Onbekend product',
    category,
    unit: (raw.unit || '').trim() || 'per stuk',
    regularPrice,
    offerPrice,
    discountLabel,
    validFrom: raw.validFrom || week.validFrom,
    validUntil: raw.validUntil || week.validUntil,
    imageEmoji: CATEGORY_EMOJI[category] || '🛒',
    ...(raw.imageUrl ? { imageUrl: raw.imageUrl } : {}),
    ...(raw.productUrl ? { productUrl: raw.productUrl } : {}),
  };
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
  // Jumbo lazy-loads tiles as you scroll. Keep scrolling until the height stops
  // growing (or we hit a sane cap).
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

/** DOM extraction: run inside the page and pull text out of each offer tile. */
async function extractFromDom(page, selectors) {
  return page.evaluate((sel) => {
    const pickText = (root, candidates) => {
      for (const c of candidates) {
        const el = root.querySelector(c);
        const text = el?.textContent?.trim();
        if (text) return text;
      }
      return '';
    };

    let tiles = [];
    for (const tileSel of sel.tile) {
      const found = Array.from(document.querySelectorAll(tileSel));
      if (found.length >= 3) {
        tiles = found;
        break;
      }
    }

    return tiles.map((tile) => {
      const name = pickText(tile, sel.name);
      const priceText = pickText(tile, sel.price);
      const promoText = pickText(tile, sel.promo);
      const img = sel.image.map((s) => tile.querySelector(s)).find(Boolean);
      const link = sel.link.map((s) => tile.querySelector(s)).find(Boolean);
      return {
        name,
        priceText,
        promoText,
        unit: tile.getAttribute('data-unit') || '',
        imageUrl: img?.getAttribute('src') || img?.getAttribute('data-src') || '',
        productUrl: link?.getAttribute('href') || '',
      };
    });
  }, selectors);
}

/**
 * Try to read structured data straight out of Next.js's embedded JSON. This is
 * far more reliable than DOM scraping *when it's present* — but the exact path
 * to the promotions array changes between Jumbo releases, so we search the blob
 * for objects that look like products rather than hard-coding a path.
 */
async function extractFromNextData(page) {
  const nextData = await page.evaluate(() => {
    const el = document.querySelector('#__NEXT_DATA__');
    if (!el?.textContent) return null;
    try {
      return JSON.parse(el.textContent);
    } catch {
      return null;
    }
  });
  if (!nextData) return [];

  const results = [];
  const seen = new Set();
  const looksLikeProduct = (o) =>
    o && typeof o === 'object' && typeof o.title === 'string' &&
    (o.prices || o.price || o.promotion || o.currentPrice);

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (looksLikeProduct(node) && !seen.has(node.title)) {
      seen.add(node.title);
      const priceObj = node.prices || node.price || node.currentPrice || {};
      const price =
        typeof priceObj === 'number'
          ? priceObj
          : priceObj.price ?? priceObj.amount ?? priceObj.now ?? '';
      const wasPrice = priceObj.was ?? priceObj.original ?? priceObj.regular ?? '';
      const promo = node.promotion?.tags?.map((t) => t.text).join(' ') ||
        node.promotion?.name || node.promotionLabel || '';
      results.push({
        id: node.sku || node.id || '',
        name: node.title,
        priceText: `${wasPrice} ${price}`,
        promoText: String(promo),
        unit: node.quantity || node.unit || node.subtitle || '',
        imageUrl: node.image || node.imageUrl || node.images?.[0]?.url || '',
        productUrl: node.link || node.url || '',
      });
    }
    Object.values(node).forEach(walk);
  };
  walk(nextData);
  return results;
}

async function main() {
  log(`opening ${OFFERS_URL}`);
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
    await page.goto(OFFERS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await acceptCookies(page);
    await page.waitForTimeout(1500);
    await autoScroll(page);

    if (DEBUG) {
      await mkdir(DEBUG_DIR, { recursive: true });
      await writeFile(resolve(DEBUG_DIR, 'page.html'), await page.content());
      await page.screenshot({ path: resolve(DEBUG_DIR, 'page.png'), fullPage: true });
      const nextRaw = await page.evaluate(
        () => document.querySelector('#__NEXT_DATA__')?.textContent || '',
      );
      await writeFile(resolve(DEBUG_DIR, 'next-data.json'), nextRaw || '(no __NEXT_DATA__ found)');
      log(`debug artifacts written to ${DEBUG_DIR}`);
    }

    log('trying __NEXT_DATA__ strategy…');
    let raw = await extractFromNextData(page);
    log(`  __NEXT_DATA__ yielded ${raw.length} products`);

    if (raw.length < 3) {
      log('falling back to DOM strategy…');
      raw = await extractFromDom(page, SELECTORS);
      log(`  DOM yielded ${raw.length} products`);
    }

    const week = currentWeekRange();
    const offers = raw
      .filter((r) => r.name && r.name.length > 1)
      .map((r) => normalize(r, week));

    // De-dupe by id, keeping the first occurrence.
    const byId = new Map();
    for (const offer of offers) {
      if (!byId.has(offer.id)) byId.set(offer.id, offer);
    }
    const finalOffers = [...byId.values()];

    if (finalOffers.length === 0) {
      log('⚠️  No offers extracted. Run again with --debug and inspect');
      log('   scraper/debug/page.html to update the selectors in SELECTORS.');
      process.exitCode = 1;
    }

    await writeFile(OUTPUT_FILE, JSON.stringify(finalOffers, null, 2) + '\n');
    log(`wrote ${finalOffers.length} offers to ${OUTPUT_FILE}`);
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
