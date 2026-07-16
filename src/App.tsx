import { useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { OffersPage } from './pages/OffersPage';
import { MyRecipesPage } from './pages/MyRecipesPage';
import { RecipeFormPage } from './pages/RecipeFormPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { useRecipes } from './hooks/useRecipes';
import { useShoppingList } from './hooks/useShoppingList';
import { getThisWeeksOffers } from './data/offerProducts';

export default function App() {
  const offers = useMemo(() => getThisWeeksOffers(), []);
  const { allRecipes, addRecipe, updateRecipe, deleteRecipe, isLoading, error } = useRecipes();
  const shoppingList = useShoppingList();

  return (
    <div className="app">
      <NavBar shoppingListCount={shoppingList.items.filter((i) => !i.checked).length} />
      <main className="app__content">
        {error && <p className="form-error">Couldn't reach the database: {error}</p>}
        <Routes>
          <Route path="/" element={<HomePage recipes={allRecipes} offers={offers} isLoading={isLoading} />} />
          <Route path="/offers" element={<OffersPage offers={offers} />} />
          <Route
            path="/recipes"
            element={<MyRecipesPage recipes={allRecipes} onDelete={deleteRecipe} isLoading={isLoading} />}
          />
          <Route path="/recipes/new" element={<RecipeFormPage onCreate={addRecipe} offers={offers} />} />
          <Route
            path="/recipes/:id/edit"
            element={<RecipeFormPage recipes={allRecipes} onUpdate={updateRecipe} offers={offers} />}
          />
          <Route
            path="/recipes/:id"
            element={<RecipeDetailPage recipes={allRecipes} offers={offers} onAddToShoppingList={shoppingList.addItems} />}
          />
          <Route path="/shopping-list" element={<ShoppingListPage shoppingList={shoppingList} />} />
        </Routes>
      </main>
    </div>
  );
}
