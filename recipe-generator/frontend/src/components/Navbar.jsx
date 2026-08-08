import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onAuthOpen }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <div className="brand">
        ChefGpt<span className="brand-mark">.</span>
      </div>
      <div className="nav-links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>Cook Recipies</Link>
        <Link to="/favorites" className={pathname === '/favorites' ? 'active' : ''}>Favorites</Link>
        <Link to="/meal-planner" className={pathname === "/meal-planner" ? "active" : ""}> Meal Planner </Link>
         <Link to="/myrecipes" className={pathname === "/myrecipes" ? "active" : ""}> My Recipes</Link>
        {user ? (
          <button onClick={logout}>Log out ({user.name.split(' ')[0]})</button>
        ) : (
          <button className="btn-primary" onClick={onAuthOpen}>Sign in</button>
        )}
      </div>
    </nav>
  );
}
