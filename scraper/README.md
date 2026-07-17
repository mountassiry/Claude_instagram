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
npm run scrape -- --debug     # also dump raw HTML, __NEXT_DATA__ and a
                              # screenshot to scraper/debug/ for inspection
npm run scrape -- --headed    # run with a visible browser window to watch it
```

## How it works

The scraper tries two strategies, in order:

1. **`__NEXT_DATA__`** — Jumbo is a Next.js site, so the page often embeds its
   data as JSON in a `<script id="__NEXT_DATA__">` tag. The scraper walks that
   JSON looking for product-shaped objects. This is the most reliable source
   when it's present.
2. **DOM scraping** — if the JSON strategy finds too little, it falls back to
   reading text out of the rendered product tiles using the selectors in the
   `SELECTORS` block at the top of `scrapeJumbo.mjs`.

Whatever it finds is normalized into the app's `OfferProduct` shape: it keeps
the original Dutch promotion text as the discount label, does best-effort
parsing of "van €X voor €Y", "2 voor €3", and "25% korting" style promotions
into regular/offer prices, and maps each product into one of the app's fixed
categories by keyword.

## Fixing selectors

If a run prints `No offers extracted`:

1. Run `npm run scrape -- --debug`.
2. Open `scraper/debug/page.html` (or `page.png`) and find an offer tile.
3. Update the `SELECTORS` object at the top of `scraper/scrapeJumbo.mjs` so
   `tile`/`name`/`price`/`promo` point at the right elements.
4. Also check `scraper/debug/next-data.json` — if the offers are in there, it's
   usually cleaner to adjust the `looksLikeProduct` heuristic in
   `extractFromNextData` instead.
