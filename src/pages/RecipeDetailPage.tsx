import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { OfferProduct, Recipe } from '../types';
import { rankRecipe } from '../utils/matching';
import { jumboSearchUrl } from '../data/offerProducts';
import { useAuth } from '../contexts/AuthContext';

interface RecipeDetailPageProps {
  recipes: Recipe[];
  offers: OfferProduct[];
  onAddToShoppingList: (items: { name: string; quantity: string; recipeTitle: string }[]) => void;
  onDelete: (id: string) => Promise<void>;
}

export function RecipeDetailPage({ recipes, offers, onAddToShoppingList, onDelete }: RecipeDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const isOwner = recipe.isCustom && recipe.authorId === user?.uid;

  const handleDelete = async () => {
    if (!window.confirm('Delete this recipe? This can\'t be undone.')) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(recipe.id);
      navigate('/recipes');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the recipe. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <div className="page__header page__header--row">
        <div>
          <h1>
            {recipe.imageEmoji} {recipe.title}
          </h1>
          <p className="page__subtitle">{recipe.description}</p>
          <div className="recipe-card__meta">
            <span>⏱ {recipe.prepMinutes} min</span>
            <span>🍽 {recipe.servings} servings</span>
            <span>{recipe.isCustom ? `by ${recipe.authorName ?? 'a community member'}` : 'Starter recipe'}</span>
          </div>
        </div>
        {isOwner && (
          <div className="recipe-card-wrapper__actions">
            <Link to={`/recipes/${recipe.id}/edit`} className="button button--small">
              Edit
            </Link>
            <button className="button button--small button--danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {deleteError && <p className="form-error">{deleteError}</p>}

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
