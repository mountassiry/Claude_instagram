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
  const { allRecipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const shoppingList = useShoppingList();

  return (
    <div className="app">
      <NavBar shoppingListCount={shoppingList.items.filter((i) => !i.checked).length} />
      <main className="app__content">
        <Routes>
          <Route path="/" element={<HomePage recipes={allRecipes} offers={offers} />} />
          <Route path="/offers" element={<OffersPage offers={offers} />} />
          <Route path="/recipes" element={<MyRecipesPage recipes={allRecipes} onDelete={deleteRecipe} />} />
          <Route path="/recipes/new" element={<RecipeFormPage onSave={addRecipe} offers={offers} />} />
          <Route path="/recipes/:id/edit" element={<RecipeFormPage recipes={allRecipes} onSave={updateRecipe} offers={offers} />} />
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
