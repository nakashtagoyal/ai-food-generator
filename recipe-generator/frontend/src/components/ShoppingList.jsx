import React from 'react';

export default function ShoppingList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="shopping-list-card">
      <h4>Shopping list for these picks</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
