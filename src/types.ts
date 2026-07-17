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
  category: ProductCategory;
  unit: string;
  regularPrice: number;
  offerPrice: number;
  discountLabel: string;
  validFrom: string;
  validUntil: string;
  imageEmoji: string;
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
