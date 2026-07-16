import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';

interface MyRecipesPageProps {
  recipes: Recipe[];
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function MyRecipesPage({ recipes, onDelete, isLoading }: MyRecipesPageProps) {
  const custom = recipes.filter((r) => r.isCustom);
  const starter = recipes.filter((r) => !r.isCustom);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await onDelete(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the recipe. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>My Recipes</h1>
          <p className="page__subtitle">Create your own recipes so they can be picked for future weekly offers.</p>
        </div>
        <Link to="/recipes/new" className="button button--primary">
          + New Recipe
        </Link>
      </div>

      {deleteError && <p className="form-error">{deleteError}</p>}

      <section>
        <h2>Your recipes</h2>
        {isLoading ? (
          <p>Loading your recipes…</p>
        ) : custom.length === 0 ? (
          <p>You haven't created any recipes yet.</p>
        ) : (
          <div className="recipe-grid">
            {custom.map((recipe) => (
              <div key={recipe.id} className="recipe-card-wrapper">
                <RecipeCard recipe={recipe} />
                <div className="recipe-card-wrapper__actions">
                  <Link to={`/recipes/${recipe.id}/edit`} className="button button--small">
                    Edit
                  </Link>
                  <button
                    className="button button--small button--danger"
                    onClick={() => handleDelete(recipe.id)}
                    disabled={deletingId === recipe.id}
                  >
                    {deletingId === recipe.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Starter recipes</h2>
        <div className="recipe-grid">
          {starter.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </div>
  );
}
