// import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import IngredientInput from '../components/IngredientInput.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import RecipeDetail from '../components/RecipeDetail.jsx';
import ShoppingList from '../components/ShoppingList.jsx';
import * as api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import recipebg from "../../ recipebg.jpeg";
import recbg1 from "../../recbg1.jpeg";
import recbg2 from "../../recbg2.jpeg";
import recbg3 from "../../recbg3.jpeg";

// import { useEffect, useState } from 'react';

const DIET_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'keto', 'high-protein'];

export default function RecipeGeneratorPage({ onAuthOpen }) {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [diet, setDiet] = useState([]);
  // const [useAI, setUseAI] = useState(false);
  const [results, setResults] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const backgrounds = [
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=80",
    recipebg, recbg1, recbg2, recbg3
  ];

  const [bg, setBg] = useState(backgrounds[0]);

  useEffect(() => {
    const changeBackground = () => {
      const random =
        backgrounds[Math.floor(Math.random() * backgrounds.length)];
      setBg(random);
    };

    changeBackground(); // Random image on first load

    const interval = setInterval(changeBackground, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadFavorites = async () => {
      try {
        const favorites = await api.getFavorites();
        setFavoriteIds(favorites.map((recipe) => recipe._id));
      } catch (err) {
        console.error(err);
      }
    };
    loadFavorites();
  }, [user]);

  const toggleDiet = (d) => setDiet((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleGenerate = async () => {
    if (!ingredients.length) {
      setError('Add at least one ingredient to get started.');
      return;
    }
    setError('');
    setLoading(true);
    setSelected(null);
    try {
      const data = await api.generateRecipes({ ingredients, diet });
      setResults(data.recipes);
      setShoppingList(data.shoppingList || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate recipes. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (recipe) => {
    if (!user) {
      onAuthOpen();
      return;
    }
    try {
      let savedRecipe = recipe;
      // Save the recipe only if it hasn't been saved before
      if (!recipe._id) {
        const dbRecipe = await api.saveRecipe(recipe);

        savedRecipe = {
          ...recipe,      // keep image and all existing fields
          ...dbRecipe     // add _id and database fields
        };

        setResults((prev) =>
          prev.map((r) =>
            r.title === recipe.title ? savedRecipe : r
          )
        );
      }
      const { favorites } = await api.toggleFavorite(savedRecipe._id);
      // Update heart colors instantly
      // setFavoriteIds(favorites);
      setFavoriteIds(
        favorites.map((f) => (typeof f === "object" ? f._id : f))
      );
    } catch (err) {
      console.error(err);
      setError("Could not update favorites.");
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
        backgroundRepeat: "no-repeat"
      }}
    >
      <section className="hero" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(${bg})',
      }}>
        <div className="hero-eyebrow">what's in your kitchen?</div>
        <h1>Turn what you have into what you'll eat.</h1>
        <p>
          List the ingredients sitting in your fridge and pantry. We'll match them against real recipes,
          rank by how close you are to cooking tonight, and build a shopping list for the rest.
        </p>
      </section>

      <div className="page-content">

        <div className="pantry-card">
          <span className="pantry-label">Your ingredients</span>
          <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />

          <div className="diet-filters">
            {DIET_OPTIONS.map((d) => (
              <button
                key={d}
                className={`diet-pill ${diet.includes(d) ? 'selected' : ''}`}
                onClick={() => toggleDiet(d)}
                type="button"
              >
                {d}
              </button>
            ))}
          </div>

          <div className="pantry-actions">
            <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Generate recipes'}
            </button>
            {/* <label className="ai-toggle">
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            Try AI chef mode (needs API key configured)
          </label> */}
          </div>
          {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
        </div>

        <ShoppingList items={shoppingList} />

        {selected && <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />}

        {results.length > 0 && (
          <>
            <div className="section-heading">
              <h2>Matches for you</h2>
              <span>{results.length} recipes</span>
            </div>
            <div className="recipe-grid">
              {results.map((r) => (
                <RecipeCard
                  key={r.title}
                  recipe={r}
                  onOpen={setSelected}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={favoriteIds.includes(r._id)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && results.length === 0 && (
          <div className="empty-state">
            <h3>Your recipe board is empty</h3>
            <p>Add a few ingredients above and hit generate to see what's possible.</p>
          </div>
        )}
      </div>
    </div>
  );
}
