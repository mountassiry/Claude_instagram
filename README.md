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
- **Firebase Firestore** — your own recipes are stored in a real database, synced in real time
- Shopping list is saved in the browser's `localStorage` (it's a personal scratch list, not shared)

## Getting started

### Firebase setup

Your recipes are stored in Firestore, so you need a Firebase project:

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a project.
2. Enable **Firestore Database** (Build > Firestore Database > Create database).
3. Deploy the security rules in `firestore.rules` (Firestore Database > Rules, paste the file's contents, publish). These rules have no authentication to check against — they only validate that saved recipes look like recipes — so **anyone with your app's URL can create or delete recipes**. Add Firebase Auth and scope the rules to `request.auth.uid` if you need recipes to be private.
4. Project Settings > General > Your apps > Add app > Web, then copy the config values.
5. Copy `.env.example` to `.env` and fill in the values from step 4:

```bash
cp .env.example .env
```

### Run the app

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

### Developing without a real Firebase project

You can run against the local Firestore emulator instead of a real project — no Firebase account needed:

```bash
npm install -g firebase-tools   # if you don't have it
firebase emulators:start --only firestore
```

Then set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` (the other `VITE_FIREBASE_*` values can be any placeholder strings when only using the emulator).

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
├── config/
│   └── firebase.ts         # Firebase app + Firestore initialization
├── hooks/
│   ├── useRecipes.ts       # recipe CRUD, persisted to Firestore
│   └── useShoppingList.ts  # shopping list state, persisted to localStorage
├── utils/
│   ├── matching.ts         # ranks recipes by how many ingredients are on offer
│   └── week.ts             # current Jumbo offer week (Mon–Sun) helpers
├── components/             # NavBar, RecipeCard
├── pages/                  # HomePage, OffersPage, MyRecipesPage, RecipeFormPage, RecipeDetailPage, ShoppingListPage
├── App.tsx                 # routes
└── main.tsx                # entry point
```
