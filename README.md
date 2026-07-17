# Weekly Recipes — Jumbo Offers

A web app for creating your own recipes and getting **10 recipe suggestions every week** built around whatever products are currently on offer at Jumbo, so you can order the ingredients for delivery.

## How it works

- **Login** — the whole app is behind a login wall (email/password or Google). Everyone who logs in shares the same recipe library.
- **This Week** — ranks all recipes (everyone's + starter recipes) by how many ingredients are on this week's offers, and shows the top 10, with the savings for each.
- **Offers** — browse this week's full offer catalog by category.
- **Recipe Library** — every recipe anyone has created, visible to all users. You can edit or delete your own; everyone else's are view-only.
- **Shopping List** — collect the on-offer ingredients for a recipe you want to cook, check them off, and jump straight to a Jumbo search page for each product to add it to your Jumbo order.

## About the Jumbo data

Jumbo has no official public API for third-party apps to read weekly offers or place orders. This app currently runs on **mock offer data** (`src/data/offerProducts.ts`) standing in for a real weekly-offers feed, so the whole app can be built and used end-to-end.

Ordering itself is not automated — "Open in Jumbo" links just open a Jumbo product search (`jumbo.com/zoeken?searchTerms=...`) in a new tab; you add the item to your Jumbo cart and check out there yourself.

If real offer data becomes available later (an approved partner API, or manually curated data entered by an admin), only `getThisWeeksOffers()` in `src/data/offerProducts.ts` needs to change — every other part of the app (matching, ranking, UI) already consumes plain `OfferProduct[]` data and doesn't care where it came from.

## Tech stack

- React + TypeScript + Vite
- react-router-dom for routing
- **Firebase Authentication** (email/password + Google) — the app requires login
- **Firebase Firestore** — the shared recipe library, synced in real time; each recipe is attributed to its author, who is the only one who can edit or delete it
- Shopping list is saved in the browser's `localStorage` (it's a personal scratch list, not shared)

## Getting started

### Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a project.
2. **Authentication** (Build > Authentication > Get started) — enable the **Email/Password** and **Google** sign-in providers.
3. **Firestore Database** (Build > Firestore Database > Create database).
4. Deploy the security rules in `firestore.rules` (Firestore Database > Rules, paste the file's contents, publish). These require a signed-in user for every read/write, and only let someone edit or delete recipes they authored.
5. Project Settings > General > Your apps > Add app > Web, then copy the config values.
6. Copy `.env.example` to `.env` and fill in the values from step 5:

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

You can run against local Firebase emulators instead of a real project — no Firebase account needed:

```bash
npm install -g firebase-tools   # if you don't have it
firebase emulators:start --only firestore,auth
```

Then set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` (the other `VITE_FIREBASE_*` values can be any placeholder strings when only using the emulators). Google sign-in against the emulator uses a fake IDP picker instead of a real Google account.

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
│   └── firebase.ts         # Firebase app + Firestore + Auth initialization
├── contexts/
│   └── AuthContext.tsx     # signed-in user state, sign up / log in / log out
├── hooks/
│   ├── useRecipes.ts       # shared recipe library CRUD, persisted to Firestore
│   └── useShoppingList.ts  # shopping list state, persisted to localStorage
├── utils/
│   ├── matching.ts         # ranks recipes by how many ingredients are on offer
│   └── week.ts             # current Jumbo offer week (Mon–Sun) helpers
├── components/             # NavBar, RecipeCard
├── pages/                  # LoginPage, HomePage, OffersPage, MyRecipesPage (Recipe Library), RecipeFormPage, RecipeDetailPage, ShoppingListPage
├── App.tsx                 # routes + login gate
└── main.tsx                # entry point
```
