/**
 * Tests for the pure parsing/normalization helpers. These don't touch the
 * network or a browser — they check that realistic Jumbo promotion strings are
 * turned into sensible OfferProduct data.
 *
 * Run: node scraper/scrapeJumbo.test.mjs
 */
import assert from 'node:assert/strict';
import { categoryFor, normalize } from './scrapeJumbo.mjs';

const week = { validFrom: '2026-01-01T00:00:00.000Z', validUntil: '2026-01-07T00:00:00.000Z' };
let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

console.log('categoryFor:');
check('classifies meat', () => assert.equal(categoryFor('Jumbo Kipfilet'), 'Vlees & Vis'));
check('classifies produce', () => assert.equal(categoryFor('Broccoli'), 'Groente & Fruit'));
check('classifies dairy', () => assert.equal(categoryFor('Goudse jong belegen kaas'), 'Zuivel & Eieren'));
check('falls back to a default', () => assert.equal(categoryFor('Iets heel exotisch'), 'Kruiden & Sauzen'));

console.log('normalize — "van X voor Y":');
check('parses from/for prices', () => {
  const o = normalize({ name: 'Zalmfilet', priceText: 'van €7.99 voor €5.99' }, week);
  assert.equal(o.regularPrice, 7.99);
  assert.equal(o.offerPrice, 5.99);
});

console.log('normalize — percentage:');
check('derives regular price from % off', () => {
  const o = normalize({ name: 'Kipfilet', priceText: '€4.19', promoText: '25% korting' }, week);
  assert.equal(o.offerPrice, 4.19);
  // 4.19 / (1 - 0.25) = 5.5867 -> 5.59
  assert.equal(o.regularPrice, 5.59);
  assert.equal(o.discountLabel, '25% korting');
});

console.log('normalize — multibuy "2 voor 3":');
check('computes per-unit offer price', () => {
  const o = normalize({ name: 'Passata', priceText: '€1.79', promoText: '2 voor €3.00' }, week);
  assert.equal(o.offerPrice, 1.5); // 3.00 / 2
  assert.equal(o.regularPrice, 1.79); // highest amount seen = original single price
  assert.equal(o.discountLabel, '2 voor €3.00');
});

console.log('normalize — general shape:');
check('keeps unit, dates, image url, and makes an id', () => {
  const o = normalize(
    {
      name: "Jumbo Paprika's Gemengd",
      priceText: '€1.87',
      unit: '3 stuks',
      imageUrl: 'https://example.com/paprika.jpg',
      productUrl: '/producten/paprika',
    },
    week,
  );
  assert.equal(o.unit, '3 stuks');
  assert.equal(o.validFrom, week.validFrom);
  assert.equal(o.validUntil, week.validUntil);
  assert.equal(o.imageUrl, 'https://example.com/paprika.jpg');
  assert.equal(o.productUrl, '/producten/paprika');
  assert.ok(o.id.length > 0 && !o.id.includes(' '), 'id should be a non-empty slug');
  assert.equal(o.category, 'Groente & Fruit');
});

check('handles a bare price with no promo text', () => {
  const o = normalize({ name: 'Melk', priceText: '€1.09' }, week);
  assert.equal(o.offerPrice, 1.09);
  assert.equal(o.regularPrice, 1.09);
  assert.equal(o.discountLabel, 'Aanbieding');
});

console.log(`\nAll ${passed} assertions passed.`);
