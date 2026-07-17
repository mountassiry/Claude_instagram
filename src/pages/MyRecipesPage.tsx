import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { useAuth } from '../contexts/AuthContext';

interface MyRecipesPageProps {
  recipes: Recipe[];
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function MyRecipesPage({ recipes, onDelete, isLoading }: MyRecipesPageProps) {
  const { user } = useAuth();
  const mine = recipes.filter((r) => r.isCustom && r.authorId === user?.uid);
  const community = recipes.filter((r) => r.isCustom && r.authorId !== user?.uid);
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
          <h1>Recipe Library</h1>
          <p className="page__subtitle">
            Every recipe anyone has added, shared by everyone — create your own to add it to the library.
          </p>
        </div>
        <Link to="/recipes/new" className="button button--primary">
          + New Recipe
        </Link>
      </div>

      {deleteError && <p className="form-error">{deleteError}</p>}

      <section>
        <h2>Your recipes</h2>
        {isLoading ? (
          <p>Loading recipes…</p>
        ) : mine.length === 0 ? (
          <p>You haven't created any recipes yet.</p>
        ) : (
          <div className="recipe-grid">
            {mine.map((recipe) => (
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

      {community.length > 0 && (
        <section>
          <h2>From the community</h2>
          <div className="recipe-grid">
            {community.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

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
