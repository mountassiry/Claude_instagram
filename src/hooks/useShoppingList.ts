import { useCallback, useEffect, useState } from 'react';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  recipeTitle: string;
  checked: boolean;
}

const STORAGE_KEY = 'jumbo-weekly-recipes:shopping-list';

function load(): ShoppingListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShoppingListItem[]) : [];
  } catch {
    return [];
  }
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItems = useCallback((newItems: Omit<ShoppingListItem, 'id' | 'checked'>[]) => {
    setItems((prev) => [
      ...prev,
      ...newItems.map((i) => ({ ...i, id: `${i.recipeTitle}-${i.name}-${Math.random().toString(36).slice(2)}`, checked: false })),
    ]);
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearList = useCallback(() => setItems([]), []);

  return { items, addItems, toggleItem, removeItem, clearList };
}
