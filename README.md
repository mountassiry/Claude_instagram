# Weekly Recipes — Jumbo Offers

A web app for creating your own recipes and getting **10 recipe suggestions every week** built around whatever products are currently on offer at Jumbo, so you can order the ingredients for delivery.

## How it works

- **This Week** — ranks all recipes (yours + starter recipes) by how many ingredients are on this week's offers, and shows the top 10, with the savings for each.
- **Offers** — browse this week's full offer catalog by category.
- **My Recipes** — create, edit and delete your own recipes with ingredients and steps.
- **Shopping List** — collect the on-offer ingredients for a recipe you want to cook, check them off, and jump straight to a Jumbo search page for each product to add it to your Jumbo order.

## About the Jumbo data

Jumbo has no official public API for third-party apps to read weekly offers or place orders. This app currently runs on **mock offer data** (`src/data/offerProducts.ts`) standing in for a real weekly-offers feed, so the whole app can be built and used end-to-end.

Ordering itself is not automated — "Open in Jumbo" links just open a Jumbo product search (`jumbo.com/zoeken?searchTerms=...`) in a new tab; you add the item to your Jumbo cart and check out there yourself.

If real offer data becomes available later (an approved partner API, or manually curated data entered by an admin), only `getThisWeeksOffers()` in `src/data/offerProducts.ts` needs to change — every other part of the app (matching, ranking, UI) already consumes plain `OfferProduct[]` data and doesn't care where it came from.

## Tech stack

- React + TypeScript + Vite
- react-router-dom for routing
- No backend — your own recipes and shopping list are saved in the browser's `localStorage`

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

### Other scripts

```bash
npm run build     # type-check and build for production
npm run preview   # preview the production build
npm run lint       # run eslint
```

## Project structure

```
src/
├── data/
│   ├── offerProducts.ts   # mock weekly Jumbo offers — swap for a real source here
│   └── starterRecipes.ts  # seed recipes so the weekly picks aren't empty on first run
├── hooks/
│   ├── useRecipes.ts       # recipe CRUD, persisted to localStorage
│   └── useShoppingList.ts  # shopping list state, persisted to localStorage
├── utils/
│   ├── matching.ts         # ranks recipes by how many ingredients are on offer
│   └── week.ts             # current Jumbo offer week (Mon–Sun) helpers
├── components/             # NavBar, RecipeCard
├── pages/                  # HomePage, OffersPage, MyRecipesPage, RecipeFormPage, RecipeDetailPage, ShoppingListPage
├── App.tsx                 # routes
└── main.tsx                # entry point
```
