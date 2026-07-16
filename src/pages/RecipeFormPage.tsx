import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { OfferProduct, Recipe, RecipeIngredient } from '../types';

interface RecipeFormPageProps {
  recipes?: Recipe[];
  offers: OfferProduct[];
  onSave: (recipe: Recipe) => void;
}

function emptyIngredient(): RecipeIngredient {
  return { id: Math.random().toString(36).slice(2), name: '', quantity: '' };
}

export function RecipeFormPage({ recipes, offers, onSave }: RecipeFormPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? recipes?.find((r) => r.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [servings, setServings] = useState(existing?.servings ?? 4);
  const [prepMinutes, setPrepMinutes] = useState(existing?.prepMinutes ?? 20);
  const [imageEmoji, setImageEmoji] = useState(existing?.imageEmoji ?? '🍽️');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    existing?.ingredients ?? [emptyIngredient()],
  );
  const [steps, setSteps] = useState<string[]>(existing?.steps ?? ['']);

  const updateIngredient = (index: number, patch: Partial<RecipeIngredient>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe: Recipe = {
      id: existing?.id ?? `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      servings,
      prepMinutes,
      imageEmoji,
      isCustom: true,
      ingredients: ingredients.filter((i) => i.name.trim() !== ''),
      steps: steps.filter((s) => s.trim() !== ''),
    };
    onSave(recipe);
    navigate(`/recipes/${recipe.id}`);
  };

  return (
    <div className="page">
      <h1>{existing ? 'Edit recipe' : 'New recipe'}</h1>
      <form className="recipe-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <div className="recipe-form__row">
          <label>
            Servings
            <input type="number" min={1} value={servings} onChange={(e) => setServings(Number(e.target.value))} />
          </label>
          <label>
            Prep minutes
            <input type="number" min={1} value={prepMinutes} onChange={(e) => setPrepMinutes(Number(e.target.value))} />
          </label>
          <label>
            Emoji
            <input value={imageEmoji} onChange={(e) => setImageEmoji(e.target.value)} maxLength={4} />
          </label>
        </div>

        <fieldset>
          <legend>Ingredients</legend>
          {ingredients.map((ingredient, index) => (
            <div key={ingredient.id} className="recipe-form__ingredient-row">
              <input
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => updateIngredient(index, { name: e.target.value })}
              />
              <input
                placeholder="Quantity"
                value={ingredient.quantity}
                onChange={(e) => updateIngredient(index, { quantity: e.target.value })}
              />
              <select
                value={ingredient.productId ?? ''}
                onChange={(e) => updateIngredient(index, { productId: e.target.value || undefined })}
              >
                <option value="">Not linked to an offer product</option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button button--small button--danger"
                onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="button button--small" onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}>
            + Add ingredient
          </button>
        </fieldset>

        <fieldset>
          <legend>Steps</legend>
          {steps.map((step, index) => (
            <div key={index} className="recipe-form__step-row">
              <span>{index + 1}.</span>
              <input value={step} onChange={(e) => updateStep(index, e.target.value)} />
              <button
                type="button"
                className="button button--small button--danger"
                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="button button--small" onClick={() => setSteps((prev) => [...prev, ''])}>
            + Add step
          </button>
        </fieldset>

        <div className="recipe-form__actions">
          <button type="submit" className="button button--primary">
            Save recipe
          </button>
        </div>
      </form>
    </div>
  );
}
