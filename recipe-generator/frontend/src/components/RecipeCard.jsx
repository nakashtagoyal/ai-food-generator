import React from 'react';
export default function RecipeCard({ recipe, onOpen, onToggleFavorite, isFavorite }) {
  console.log(recipe.title, recipe.image);
  return (
    <div className="recipe-card">
      
{recipe.image && (
  <img
    src={recipe.image}
    alt={recipe.title}
    className="recipe-card-image"
  />
)}
      <div className="card-top">
        <h3>{recipe.title}</h3>
        {typeof recipe.matchScore === 'number' && (
          <span className="match-badge">{recipe.matchScore}% match</span>
        )}
      </div>


      <div className="meta-row">
        <span>{recipe.cuisine}</span>
        <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min</span>
        <span>{recipe.difficulty}</span>
      </div>

      {recipe.missingIngredients?.length > 0 && (
        <div className="missing-tags">
          {recipe.missingIngredients.slice(0, 4).map((m) => (
            <span className="missing-tag" key={m}>+{m}</span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <button className="link-btn" onClick={() => onOpen(recipe)}>View recipe →</button>
        {onToggleFavorite && (
          <button aria-label="Toggle favorite"
            className={`fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe);
            }}
            // aria-label="Toggle favorite"
            // style={{
            //   color: isFavorite ? "red" : "white",
            //    color: isFavorite ? "#ff3b5c" : "#999",
            //   fontSize: "22px",
            //   border: "none",
            //   background: "transparent",
            //   cursor: "pointer"
            // }}
          >
            ♥
          </button>
        )}
      </div>
    </div>
  );
}
