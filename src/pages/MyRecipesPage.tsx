import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';

interface MyRecipesPageProps {
  recipes: Recipe[];
  onDelete: (id: string) => void;
}

export function MyRecipesPage({ recipes, onDelete }: MyRecipesPageProps) {
  const custom = recipes.filter((r) => r.isCustom);
  const starter = recipes.filter((r) => !r.isCustom);

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

      <section>
        <h2>Your recipes</h2>
        {custom.length === 0 ? (
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
                  <button className="button button--small button--danger" onClick={() => onDelete(recipe.id)}>
                    Delete
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
