import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { OfferProduct, Recipe } from '../types';
import { rankRecipe } from '../utils/matching';
import { jumboSearchUrl } from '../data/offerProducts';

interface RecipeDetailPageProps {
  recipes: Recipe[];
  offers: OfferProduct[];
  onAddToShoppingList: (items: { name: string; quantity: string; recipeTitle: string }[]) => void;
}

export function RecipeDetailPage({ recipes, offers, onAddToShoppingList }: RecipeDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <div className="page">
        <p>Recipe not found.</p>
        <button className="button" onClick={() => navigate('/')}>
          Back
        </button>
      </div>
    );
  }

  const ranked = rankRecipe(recipe, offers);
  const onOfferIngredients = ranked.matchedIngredients.filter((i) => i.offer);

  const handleAddToShoppingList = () => {
    onAddToShoppingList(
      onOfferIngredients.map((i) => ({ name: i.name, quantity: i.quantity, recipeTitle: recipe.title })),
    );
    setAdded(true);
  };

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <div className="page__header">
        <h1>
          {recipe.imageEmoji} {recipe.title}
        </h1>
        <p className="page__subtitle">{recipe.description}</p>
        <div className="recipe-card__meta">
          <span>⏱ {recipe.prepMinutes} min</span>
          <span>🍽 {recipe.servings} servings</span>
        </div>
      </div>

      {ranked.matchCount > 0 && (
        <div className="callout">
          <strong>
            {ranked.matchCount}/{recipe.ingredients.length} ingredients are on offer this week
          </strong>{' '}
          — you save €{ranked.savings.toFixed(2)}.
          <div>
            <button className="button button--primary" onClick={handleAddToShoppingList} disabled={added}>
              {added ? 'Added to shopping list ✓' : 'Add on-offer ingredients to shopping list'}
            </button>
          </div>
        </div>
      )}

      <section>
        <h2>Ingredients</h2>
        <ul className="ingredient-list">
          {ranked.matchedIngredients.map((i) => (
            <li key={i.id} className="ingredient-list__item">
              <span>
                {i.quantity} {i.name}
              </span>
              {i.offer ? (
                <span className="ingredient-list__offer">
                  <span className="badge badge--offer">{i.offer.discountLabel} on offer</span>
                  <span className="offer-card__old-price">€{i.offer.regularPrice.toFixed(2)}</span>
                  <span className="offer-card__new-price">€{i.offer.offerPrice.toFixed(2)}</span>
                  <a href={jumboSearchUrl(i.offer.name)} target="_blank" rel="noreferrer" className="button button--small">
                    Open in Jumbo
                  </a>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Steps</h2>
        <ol className="step-list">
          {recipe.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
