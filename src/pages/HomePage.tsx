import { useMemo } from 'react';
import type { OfferProduct, Recipe } from '../types';
import { pickWeeklyRecipes } from '../utils/matching';
import { RecipeCard } from '../components/RecipeCard';
import { getCurrentWeekRange, formatDateRange } from '../utils/week';

interface HomePageProps {
  recipes: Recipe[];
  offers: OfferProduct[];
}

export function HomePage({ recipes, offers }: HomePageProps) {
  const weeklyRecipes = useMemo(() => pickWeeklyRecipes(recipes, offers, 10), [recipes, offers]);
  const { start, end } = useMemo(() => getCurrentWeekRange(), []);

  return (
    <div className="page">
      <div className="page__header">
        <h1>This week's 10 recipes</h1>
        <p className="page__subtitle">
          Built from Jumbo's offers for {formatDateRange(start, end)} — save the most when you cook these.
        </p>
      </div>

      {weeklyRecipes.length === 0 ? (
        <p>No recipes match this week's offers yet. Add some recipes first.</p>
      ) : (
        <div className="recipe-grid">
          {weeklyRecipes.map((ranked) => (
            <RecipeCard key={ranked.recipe.id} recipe={ranked.recipe} ranked={ranked} />
          ))}
        </div>
      )}
    </div>
  );
}
