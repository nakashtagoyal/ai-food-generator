import React, { useState } from 'react';

export default function IngredientInput({ ingredients, setIngredients }) {
  const [draft, setDraft] = useState('');

  const addIngredient = (raw) => {
    const value = raw.trim().toLowerCase();
    if (!value || ingredients.includes(value)) return;
    setIngredients([...ingredients, value]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredient(draft);
      setDraft('');
    } else if (e.key === 'Backspace' && !draft && ingredients.length) {
      setIngredients(ingredients.slice(0, -1));
    }
  };

  const removeIngredient = (item) => setIngredients(ingredients.filter((i) => i !== item));

  return (
    <div className="chip-field" role="group" aria-label="Ingredients you have">
      {ingredients.map((item) => (
        <span className="chip" key={item}>
          {item}
          <button type="button" aria-label={`Remove ${item}`} onClick={() => removeIngredient(item)}>
            ×
          </button>
        </span>
      ))}
      <input
        className="chip-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft) { addIngredient(draft); setDraft(''); } }}
        placeholder={ingredients.length ? 'Add another…' : 'e.g. chicken, garlic, lemon'}
        aria-label="Type an ingredient and press Enter"
      />
    </div>
  );
}
