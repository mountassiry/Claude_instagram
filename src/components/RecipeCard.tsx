import { Link } from 'react-router-dom';
import type { RankedRecipe, Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  ranked?: RankedRecipe;
}

export function RecipeCard({ recipe, ranked }: RecipeCardProps) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <div className="recipe-card__emoji">{recipe.imageEmoji}</div>
      <div className="recipe-card__body">
        <h3>{recipe.title}</h3>
        <p className="recipe-card__description">{recipe.description}</p>
        <div className="recipe-card__meta">
          <span>⏱ {recipe.prepMinutes} min</span>
          <span>🍽 {recipe.servings} servings</span>
          {recipe.isCustom && recipe.authorName && <span>by {recipe.authorName}</span>}
        </div>
        {ranked && (
          <div className="recipe-card__offer-info">
            <span className="badge badge--offer">
              {ranked.matchCount}/{recipe.ingredients.length} ingredients on offer
            </span>
            {ranked.savings > 0 && <span className="badge badge--savings">Save €{ranked.savings.toFixed(2)}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
