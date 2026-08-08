import React, { useEffect, useState } from 'react';
import RecipeCard from '../components/RecipeCard.jsx';
import RecipeDetail from '../components/RecipeDetail.jsx';
import * as api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FavoritesPage({ onAuthOpen }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.getFavorites().then(setFavorites).finally(() => setLoading(false));
  }, [user]);

  const handleUnfavorite = async (recipe) => {
    await api.toggleFavorite(recipe._id);
    setFavorites((prev) => prev.filter((r) => r._id !== recipe._id));
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>Sign in to see your saved recipes</h3>
        <p>Favorites sync across devices once you're logged in.</p>
        <button className="btn-primary" onClick={onAuthOpen}>Sign in</button>
      </div>
    );
  }

  if (loading) return <div className="empty-state"><span className="spinner" /></div>;

  return (
    <div className="favorites-page">
      <div className="section-heading">
        <h2>Your favorites</h2>
        <span>{favorites.length} saved</span>
      </div>
      {selected && <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />}
      {favorites.length === 0 ? (
        <div className="empty-state">
          <h3>No favorites yet</h3>
          <p>Tap the heart on any recipe to save it here.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {favorites.map((r) => (
            <RecipeCard
              key={r._id}
              recipe={r}
              onOpen={setSelected}
              onToggleFavorite={handleUnfavorite}
              isFavorite
            />
          ))}
        </div>
      )}
    </div>
  );
}
