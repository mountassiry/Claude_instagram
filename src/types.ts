export type ProductCategory =
  | 'Vlees & Vis'
  | 'Groente & Fruit'
  | 'Zuivel & Eieren'
  | 'Broodbeleg & Bakkerij'
  | 'Pasta, Rijst & Wereldkeuken'
  | 'Kruiden & Sauzen';

export interface OfferProduct {
  id: string;
  name: string;
  /**
   * A grocery aisle/category. The built-in mock data uses the `ProductCategory`
   * values above; the Jumbo scraper passes through Jumbo's own aisle names
   * (e.g. "Aardappelen, groente en fruit"), so this is a plain string.
   */
  category: string;
  unit: string;
  regularPrice: number;
  offerPrice: number;
  discountLabel: string;
  validFrom: string;
  validUntil: string;
  imageEmoji: string;
  /** Present when the offer came from the scraper rather than the mock catalog. */
  imageUrl?: string;
  productUrl?: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  productId?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepMinutes: number;
  imageEmoji: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  isCustom: boolean;
  authorId?: string;
  authorName?: string;
}

export interface MatchedIngredient extends RecipeIngredient {
  offer?: OfferProduct;
}

export interface RankedRecipe {
  recipe: Recipe;
  matchedIngredients: MatchedIngredient[];
  matchCount: number;
  matchRatio: number;
  savings: number;
}
