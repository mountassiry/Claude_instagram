import type { useShoppingList } from '../hooks/useShoppingList';
import { jumboSearchUrl } from '../data/offerProducts';

interface ShoppingListPageProps {
  shoppingList: ReturnType<typeof useShoppingList>;
}

export function ShoppingListPage({ shoppingList }: ShoppingListPageProps) {
  const { items, toggleItem, removeItem, clearList } = shoppingList;

  return (
    <div className="page">
      <div className="page__header page__header--row">
        <div>
          <h1>Shopping list</h1>
          <p className="page__subtitle">
            Ingredients from your recipes that are on offer this week. Ordering and delivery happen on jumbo.com — this
            list just helps you find and add each item there.
          </p>
        </div>
        {items.length > 0 && (
          <button className="button" onClick={clearList}>
            Clear list
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p>Your shopping list is empty. Add on-offer ingredients from a recipe's page.</p>
      ) : (
        <ul className="shopping-list">
          {items.map((item) => (
            <li key={item.id} className={`shopping-list__item${item.checked ? ' shopping-list__item--checked' : ''}`}>
              <label className="shopping-list__label">
                <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} />
                <span>
                  {item.quantity} {item.name}
                </span>
                <span className="shopping-list__source">for {item.recipeTitle}</span>
              </label>
              <div className="shopping-list__actions">
                <a href={jumboSearchUrl(item.name)} target="_blank" rel="noreferrer" className="button button--small">
                  Open in Jumbo
                </a>
                <button className="button button--small button--danger" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
