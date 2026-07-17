import type { MatchedIngredient, OfferProduct, RankedRecipe, Recipe } from '../types';

function matchIngredient(ingredient: Recipe['ingredients'][number], offers: OfferProduct[]): MatchedIngredient {
  const offer = ingredient.productId
    ? offers.find((o) => o.id === ingredient.productId)
    : offers.find((o) => o.name.toLowerCase() === ingredient.name.toLowerCase());
  return { ...ingredient, offer };
}

export function rankRecipe(recipe: Recipe, offers: OfferProduct[]): RankedRecipe {
  const matchedIngredients = recipe.ingredients.map((i) => matchIngredient(i, offers));
  const matchCount = matchedIngredients.filter((i) => i.offer).length;
  const matchRatio = recipe.ingredients.length > 0 ? matchCount / recipe.ingredients.length : 0;
  const savings = matchedIngredients.reduce(
    (sum, i) => sum + (i.offer ? i.offer.regularPrice - i.offer.offerPrice : 0),
    0,
  );
  return { recipe, matchedIngredients, matchCount, matchRatio, savings };
}

/**
 * Picks the top N recipes best built around this week's offers: most
 * matching ingredients first, then highest match ratio, then highest savings.
 */
export function pickWeeklyRecipes(recipes: Recipe[], offers: OfferProduct[], count = 10): RankedRecipe[] {
  return recipes
    .map((r) => rankRecipe(r, offers))
    .filter((r) => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || b.matchRatio - a.matchRatio || b.savings - a.savings)
    .slice(0, count);
}
