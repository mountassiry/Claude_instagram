import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavBarProps {
  shoppingListCount: number;
}

export function NavBar({ shoppingListCount }: NavBarProps) {
  const { user, logOut } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">🛒</span>
        <span>Weekly Recipes</span>
      </div>
      <nav className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}>
          This Week
        </NavLink>
        <NavLink to="/offers" className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}>
          Offers
        </NavLink>
        <NavLink to="/recipes" className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}>
          Recipe Library
        </NavLink>
        <NavLink to="/shopping-list" className={({ isActive }) => (isActive ? 'navbar__link navbar__link--active' : 'navbar__link')}>
          Shopping List{shoppingListCount > 0 ? ` (${shoppingListCount})` : ''}
        </NavLink>
      </nav>
      {user && (
        <div className="navbar__user">
          <span className="navbar__user-name">{user.displayName || user.email}</span>
          <button className="button button--small" onClick={() => logOut()}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
