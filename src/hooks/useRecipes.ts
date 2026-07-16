import { useCallback, useEffect, useState } from 'react';
import type { Recipe } from '../types';
import { STARTER_RECIPES } from '../data/starterRecipes';

const STORAGE_KEY = 'jumbo-weekly-recipes:custom-recipes';

function loadCustomRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Recipe[]) : [];
  } catch {
    return [];
  }
}

export function useRecipes() {
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>(() => loadCustomRecipes());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRecipes));
  }, [customRecipes]);

  const addRecipe = useCallback((recipe: Recipe) => {
    setCustomRecipes((prev) => [recipe, ...prev]);
  }, []);

  const updateRecipe = useCallback((recipe: Recipe) => {
    setCustomRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)));
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setCustomRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const allRecipes = [...customRecipes, ...STARTER_RECIPES];

  return { customRecipes, allRecipes, addRecipe, updateRecipe, deleteRecipe };
}
