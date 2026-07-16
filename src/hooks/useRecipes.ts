import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import type { Recipe } from '../types';
import { STARTER_RECIPES } from '../data/starterRecipes';
import { db } from '../config/firebase';

const RECIPES_COLLECTION = 'recipes';

/** Firestore rejects `undefined` field values; JSON round-tripping drops them. */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function useRecipes() {
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const recipesQuery = query(collection(db, RECIPES_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      recipesQuery,
      (snapshot) => {
        setCustomRecipes(
          snapshot.docs.map((docSnap) => ({ ...(docSnap.data() as Omit<Recipe, 'id'>), id: docSnap.id })),
        );
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const addRecipe = async (recipe: Omit<Recipe, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, RECIPES_COLLECTION), { ...sanitize(recipe), createdAt: Date.now() });
    return docRef.id;
  };

  const updateRecipe = async (recipe: Recipe): Promise<void> => {
    const { id, ...rest } = recipe;
    await updateDoc(doc(db, RECIPES_COLLECTION, id), sanitize(rest));
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, RECIPES_COLLECTION, id));
  };

  const allRecipes = [...customRecipes, ...STARTER_RECIPES];

  return { customRecipes, allRecipes, addRecipe, updateRecipe, deleteRecipe, isLoading, error };
}
