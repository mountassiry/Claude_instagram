import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import type { Recipe } from '../types';
import { STARTER_RECIPES } from '../data/starterRecipes';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const RECIPES_COLLECTION = 'recipes';

/** Firestore rejects `undefined` field values; JSON round-tripping drops them. */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function useRecipes() {
  const { user } = useAuth();
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestore rules require an authenticated reader. Subscribing before login
  // resolves — or reusing a subscription across a login/logout transition —
  // gets a permission-denied that Firestore never auto-retries, so this
  // effect is keyed on the signed-in user's uid and only runs once there is one.
  useEffect(() => {
    if (!user) {
      setCustomRecipes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
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
  }, [user]);

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
