import type { OfferProduct, ProductCategory } from '../types';
import { getCurrentWeekRange } from '../utils/week';
import scrapedOffers from './scrapedOffers.json';

interface ProductTemplate {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  regularPrice: number;
  discountPercent: number;
  imageEmoji: string;
}

/**
 * Mock catalog standing in for Jumbo's real weekly-offers feed. Jumbo has no
 * public API for this, so `getThisWeeksOffers()` below is the single place
 * to swap in a real data source later without touching the rest of the app.
 */
const CATALOG: ProductTemplate[] = [
  { id: 'kipfilet', name: 'Kipfilet', category: 'Vlees & Vis', unit: '500g', regularPrice: 5.99, discountPercent: 30, imageEmoji: '🍗' },
  { id: 'gehakt', name: 'Half-om-half gehakt', category: 'Vlees & Vis', unit: '500g', regularPrice: 4.49, discountPercent: 25, imageEmoji: '🥩' },
  { id: 'zalmfilet', name: 'Zalmfilet', category: 'Vlees & Vis', unit: '2 stuks', regularPrice: 7.99, discountPercent: 20, imageEmoji: '🐟' },
  { id: 'spekreepjes', name: 'Spekreepjes', category: 'Vlees & Vis', unit: '150g', regularPrice: 2.29, discountPercent: 25, imageEmoji: '🥓' },
  { id: 'garnalen', name: "Garnalen", category: 'Vlees & Vis', unit: '150g', regularPrice: 4.99, discountPercent: 30, imageEmoji: '🦐' },

  { id: 'tomaten', name: 'Trostomaten', category: 'Groente & Fruit', unit: '500g', regularPrice: 2.19, discountPercent: 40, imageEmoji: '🍅' },
  { id: 'ui', name: 'Uien', category: 'Groente & Fruit', unit: '1kg', regularPrice: 1.39, discountPercent: 20, imageEmoji: '🧅' },
  { id: 'paprika', name: "Paprika's gemengd", category: 'Groente & Fruit', unit: '3 stuks', regularPrice: 2.49, discountPercent: 25, imageEmoji: '🫑' },
  { id: 'courgette', name: 'Courgette', category: 'Groente & Fruit', unit: 'per stuk', regularPrice: 0.99, discountPercent: 30, imageEmoji: '🥒' },
  { id: 'champignons', name: 'Champignons', category: 'Groente & Fruit', unit: '250g', regularPrice: 1.29, discountPercent: 25, imageEmoji: '🍄' },
  { id: 'avocado', name: "Avocado's", category: 'Groente & Fruit', unit: '2 stuks', regularPrice: 2.79, discountPercent: 35, imageEmoji: '🥑' },
  { id: 'citroen', name: 'Citroenen', category: 'Groente & Fruit', unit: '4 stuks', regularPrice: 1.99, discountPercent: 25, imageEmoji: '🍋' },
  { id: 'broccoli', name: 'Broccoli', category: 'Groente & Fruit', unit: 'per stuk', regularPrice: 1.49, discountPercent: 30, imageEmoji: '🥦' },
  { id: 'knoflook', name: 'Knoflook', category: 'Groente & Fruit', unit: '3 tenen', regularPrice: 0.79, discountPercent: 20, imageEmoji: '🧄' },

  { id: 'parmezaan', name: 'Parmezaanse kaas geraspt', category: 'Zuivel & Eieren', unit: '100g', regularPrice: 2.99, discountPercent: 25, imageEmoji: '🧀' },
  { id: 'mozzarella', name: 'Mozzarella', category: 'Zuivel & Eieren', unit: '125g', regularPrice: 1.49, discountPercent: 20, imageEmoji: '🧀' },
  { id: 'roomboter', name: 'Roomboter', category: 'Zuivel & Eieren', unit: '250g', regularPrice: 2.79, discountPercent: 20, imageEmoji: '🧈' },
  { id: 'slagroom', name: 'Slagroom', category: 'Zuivel & Eieren', unit: '250ml', regularPrice: 1.59, discountPercent: 25, imageEmoji: '🥛' },
  { id: 'eieren', name: "Scharreleieren", category: 'Zuivel & Eieren', unit: '10 stuks', regularPrice: 3.29, discountPercent: 20, imageEmoji: '🥚' },
  { id: 'creme-fraiche', name: 'Crème fraîche', category: 'Zuivel & Eieren', unit: '200ml', regularPrice: 1.39, discountPercent: 25, imageEmoji: '🥛' },

  { id: 'ciabatta', name: 'Ciabatta', category: 'Broodbeleg & Bakkerij', unit: 'per stuk', regularPrice: 1.99, discountPercent: 30, imageEmoji: '🍞' },
  { id: 'tortilla', name: 'Tortilla wraps', category: 'Broodbeleg & Bakkerij', unit: '8 stuks', regularPrice: 2.19, discountPercent: 25, imageEmoji: '🫓' },

  { id: 'pasta', name: 'Penne', category: 'Pasta, Rijst & Wereldkeuken', unit: '500g', regularPrice: 1.29, discountPercent: 20, imageEmoji: '🍝' },
  { id: 'rijst', name: 'Basmatirijst', category: 'Pasta, Rijst & Wereldkeuken', unit: '1kg', regularPrice: 2.99, discountPercent: 25, imageEmoji: '🍚' },
  { id: 'kokosmelk', name: 'Kokosmelk', category: 'Pasta, Rijst & Wereldkeuken', unit: '400ml', regularPrice: 1.49, discountPercent: 20, imageEmoji: '🥥' },
  { id: 'noedels', name: 'Eiernoedels', category: 'Pasta, Rijst & Wereldkeuken', unit: '250g', regularPrice: 1.19, discountPercent: 20, imageEmoji: '🍜' },
  { id: 'tacokit', name: 'Taco kit', category: 'Pasta, Rijst & Wereldkeuken', unit: 'per pak', regularPrice: 3.49, discountPercent: 30, imageEmoji: '🌮' },

  { id: 'pesto', name: 'Pesto Genovese', category: 'Kruiden & Sauzen', unit: '190g', regularPrice: 2.49, discountPercent: 25, imageEmoji: '🌿' },
  { id: 'tomatensaus', name: 'Passata di pomodoro', category: 'Kruiden & Sauzen', unit: '690g', regularPrice: 1.79, discountPercent: 20, imageEmoji: '🍅' },
  { id: 'sojasaus', name: 'Sojasaus', category: 'Kruiden & Sauzen', unit: '250ml', regularPrice: 2.19, discountPercent: 20, imageEmoji: '🥢' },
  { id: 'currypaste', name: 'Rode currypasta', category: 'Kruiden & Sauzen', unit: '190g', regularPrice: 2.29, discountPercent: 25, imageEmoji: '🌶️' },
  { id: 'olijfolie', name: 'Olijfolie extra vierge', category: 'Kruiden & Sauzen', unit: '500ml', regularPrice: 4.99, discountPercent: 20, imageEmoji: '🫒' },
];

function toOffer(t: ProductTemplate, validFrom: string, validUntil: string): OfferProduct {
  const offerPrice = Math.round(t.regularPrice * (1 - t.discountPercent / 100) * 100) / 100;
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    unit: t.unit,
    regularPrice: t.regularPrice,
    offerPrice,
    discountLabel: `-${t.discountPercent}%`,
    validFrom,
    validUntil,
    imageEmoji: t.imageEmoji,
  };
}

/**
 * This week's Jumbo offers.
 *
 * If `scrapedOffers.json` has been populated by the scraper (see
 * `scraper/README.md`), those real offers are used. Otherwise the app falls
 * back to the built-in mock catalog so it still works out of the box.
 * Everything downstream just consumes `OfferProduct[]` and doesn't care which
 * source it came from.
 */
export function getThisWeeksOffers(referenceDate: Date = new Date()): OfferProduct[] {
  const scraped = scrapedOffers as OfferProduct[];
  if (scraped.length > 0) {
    return scraped;
  }

  const { start, end } = getCurrentWeekRange(referenceDate);
  const validFrom = start.toISOString();
  const validUntil = end.toISOString();
  return CATALOG.map((t) => toOffer(t, validFrom, validUntil));
}

export function jumboSearchUrl(productName: string): string {
  return `https://www.jumbo.com/zoeken?searchTerms=${encodeURIComponent(productName)}`;
}
