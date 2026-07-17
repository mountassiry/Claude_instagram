/**
 * Tests for the Jumbo scraper.
 *
 *  - Unit tests for the pure promo-label parser / normalizer (no browser).
 *  - An integration test that runs the real DOM extraction against a saved
 *    sample of the offers page loaded via file:// — this validates the CSS
 *    selectors against Jumbo's actual markup without any network access.
 *
 * Run: node scraper/scrapeJumbo.test.mjs
 */
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { normalize, parseAmounts, extractFromDom } from './scrapeJumbo.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

console.log('parseAmounts:');
check('pulls prices from a multibuy label', () =>
  assert.deepEqual(parseAmounts('2 voor 5,00'), [5.0]),
);
check('pulls a single price', () => assert.deepEqual(parseAmounts('voor 0,99'), [0.99]));
check('returns nothing for a percentage label', () => assert.deepEqual(parseAmounts('25% korting'), []));

console.log('normalize:');
check('multibuy -> per-unit offer price + keeps label', () => {
  const o = normalize({ id: '1', name: 'Aardbeien', promoText: '2 voor 5,00', category: 'Groente' });
  assert.equal(o.offerPrice, 2.5);
  assert.equal(o.regularPrice, 2.5);
  assert.equal(o.discountLabel, '2 voor 5,00');
  assert.equal(o.category, 'Groente');
});
check('"voor P,PP" -> offer price', () => {
  const o = normalize({ id: '2', name: 'Krieltjes', promoText: 'voor 0,99' });
  assert.equal(o.offerPrice, 0.99);
});
check('"P,PP per 100 gram" -> offer price', () => {
  const o = normalize({ id: '3', name: 'Karbonade', promoText: '0,69 per 100 gram' });
  assert.equal(o.offerPrice, 0.69);
  assert.equal(o.discountLabel, '0,69 per 100 gram');
});
check('percentage label -> price 0, label preserved', () => {
  const o = normalize({ id: '4', name: 'Bessen', promoText: '25% korting' });
  assert.equal(o.offerPrice, 0);
  assert.equal(o.discountLabel, '25% korting');
});
check('carries dates, image, url and makes a fallback id', () => {
  const o = normalize({
    name: 'Broccoli',
    promoText: 'voor 0,89',
    validFrom: '2026-07-15T00:01:00+02:00',
    validUntil: '2026-07-21T23:59:59+02:00',
    imageUrl: 'https://example.com/b.png',
    productUrl: '/aanbiedingen/broccoli/123',
  });
  assert.equal(o.validFrom, '2026-07-15T00:01:00+02:00');
  assert.equal(o.imageUrl, 'https://example.com/b.png');
  assert.equal(o.productUrl, '/aanbiedingen/broccoli/123');
  assert.ok(o.id.length > 0 && !o.id.includes(' '));
});

async function integration() {
  const samplePath = resolve(__dirname, '../', 'scraper-sample.html');
  const envSample = process.env.JUMBO_SAMPLE_HTML;
  const path = envSample && existsSync(envSample) ? envSample : samplePath;
  if (!existsSync(path)) {
    console.log('\nintegration: skipped (no sample HTML found; set JUMBO_SAMPLE_HTML to run)');
    return;
  }

  console.log('\nintegration (DOM extraction against saved sample):');
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
  });
  const page = await browser.newPage();
  try {
    await page.goto('file://' + path, { waitUntil: 'domcontentloaded' });
    const raw = await extractFromDom(page, {
      section: 'section.category-section',
      sectionTitle: '[data-testid="category-title"], h4.category-heading',
      tile: 'article[data-testid="promotion-card"], article.card-promotion',
      title: '.title-link',
      image: 'img',
      link: '.title-link',
      tag: '.jum-tag',
      tagLower: '.lower',
    });

    check('finds all article tiles across aisle sections', () => assert.ok(raw.length >= 7, `got ${raw.length}`));
    const byId = Object.fromEntries(raw.map((r) => [r.id, r]));

    check('reads title, aisle, promo, dates, url from a normal tile', () => {
      const a = byId['3019709'];
      assert.equal(a.name, 'Nederlandse aardbeien');
      assert.equal(a.category, 'Aardappelen, groente en fruit');
      assert.equal(a.promoText, '2 voor 5,00');
      assert.equal(a.productUrl, '/aanbiedingen/nederlandse-aardbeien/3019709');
      assert.equal(a.validFrom, '2026-07-15T00:01:00+02:00');
    });
    check('reads the .lower price from a stacked ("Alleen online") tag', () => {
      const b = byId['3019730'];
      assert.equal(b.name, 'Broccoli');
      assert.equal(b.promoText, 'voor 0,89'); // not "Alleen online voor 0,89"
    });
    check('picks up the second aisle section too', () => {
      assert.equal(byId['3018527'].category, 'Vlees, vis en vega');
      assert.equal(byId['3018527'].promoText, 'voor 1,99');
    });

    console.log('\nnormalized sample:');
    const normalized = raw.map(normalize);
    check('every offer normalizes with an id, name and label', () =>
      assert.ok(normalized.every((o) => o.id && o.name && o.discountLabel)),
    );
    console.log(
      '  →',
      normalized.map((o) => `${o.name} [${o.category}] ${o.discountLabel}`).join('\n    '),
    );
  } finally {
    await browser.close();
  }
}

await integration();
console.log(`\nAll ${passed} assertions passed.`);
