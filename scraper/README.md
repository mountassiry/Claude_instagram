# Jumbo offers scraper

Fetches the current weekly offers from [jumbo.com/aanbiedingen/nu](https://www.jumbo.com/aanbiedingen/nu)
and writes them to `src/data/scrapedOffers.json`, which the app prefers over its
built-in mock catalog. When that file is empty (`[]`), the app falls back to the
mock data, so the app always works even if you never run the scraper.

## ⚠️ Read this first

- **Jumbo has no public/sanctioned API.** Scraping their website is **against
  their Terms of Service**. This is provided for personal, low-volume use only —
  run it at your own risk, don't schedule it to hammer their servers, and don't
  build a public product on top of it.
- **The page structure changes without notice.** When Jumbo updates their site
  the selectors in `scrapeJumbo.mjs` may stop matching. See _Fixing selectors_
  below.
- **It can't run in this repo's cloud/CI environment.** That environment blocks
  outbound traffic to `jumbo.com`. Run the scraper on your own machine, commit
  the resulting `scrapedOffers.json`, and deploy that.

## Setup

From the repo root:

```bash
npm install                       # installs playwright (a devDependency)
npx playwright install chromium   # one-time: download the headless browser
```

## Run it

```bash
npm run scrape
```

This opens the offers page headlessly, scrolls to load every tile, extracts the
offers, and overwrites `src/data/scrapedOffers.json`. Then start the app as
usual (`npm run dev`) and the real offers flow through the whole app — the
weekly top-10 recipes, the Offers page, and the recipe savings.

### Options

```bash
npm run scrape -- --debug            # also dump raw HTML + a screenshot to
                                     # scraper/debug/ for inspection
npm run scrape -- --headed           # run with a visible browser to watch it
npm run scrape -- --from-file x.html # scrape a saved HTML file offline (used
                                     # for testing selectors without network)
```

## How it works

The offers page is a Nuxt app that renders every offer into the DOM as an
`<article data-testid="promotion-card">`, grouped into per-aisle
`<section class="category-section">` blocks (e.g. "Aardappelen, groente en
fruit", "Vlees, vis en vega"). The scraper walks those sections and, for each
tile, reads the product title, the promotion label, the image, the product
link, and the start/expiration dates, tagging each offer with its aisle name.

The selectors live in the `SELECTORS` block at the top of `scrapeJumbo.mjs`.

**About prices:** the offers overview page only shows a _promotion label_
("2 voor 5,00", "voor 0,99", "25% korting", "1+1 gratis") — there is **no
original/regular price** on this page. So each offer keeps the exact Dutch label
as `discountLabel`, and `offerPrice`/`regularPrice` are a best-effort parse from
that label (often equal, i.e. no computable saving; `0` when the label is a
pure percentage/gift promo).

## Testing

`node scraper/scrapeJumbo.test.mjs` runs unit tests for the label parser plus an
integration test that loads a saved sample of the offers page over `file://`
and checks the DOM selectors — no network needed. Point `JUMBO_SAMPLE_HTML` at a
saved copy of the real page to validate the selectors against the latest markup.

## Fixing selectors

If a run prints `No offers extracted`:

1. Run `npm run scrape -- --debug`.
2. Open `scraper/debug/page.html` (or `page.png`) and find an offer tile.
3. Update the `SELECTORS` object at the top of `scraper/scrapeJumbo.mjs` so
   `section`/`tile`/`title`/`tag` point at the right elements.
4. Re-run the tests against a saved copy of the page:
   `JUMBO_SAMPLE_HTML=/path/to/page.html node scraper/scrapeJumbo.test.mjs`.
