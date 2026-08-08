# Pantry — MERN Recipe Generator

A full MERN (MongoDB, Express, React, Node) app that turns a list of ingredients
into ranked recipe matches, complete with a shopping list for what's missing.

## Features

- **Ingredient-match engine** — scores a local recipe knowledge base against
  what you type and ranks by percentage match, not just keyword overlap.
- **Auto-generated shopping list** — pulls together everything you're missing
  across your top matches.
- **Optional AI chef mode** — if you set `OPENAI_API_KEY` in the backend `.env`,
  toggling "AI chef mode" generates a fully original recipe via an LLM instead
  of the local dataset. Works without it too — it just falls back gracefully.
- **Diet filters** — vegan, vegetarian, gluten-free, keto, high-protein.
- **Accounts & favorites** — JWT auth, saved pantry preferences, a favorites
  library that syncs across devices.
- **Nutrition estimate, prep/cook time, difficulty** per recipe.
- **Share & print** — Web Share API with a clipboard fallback, plus a
  print-friendly recipe view.
- **Responsive, distinctive UI** — kitchen-index-card aesthetic (deep basil
  charcoal + herb green + turmeric gold), tactile ingredient chips, Fraunces/
  Inter/JetBrains Mono type system, mobile-first down to small phones.

## Project structure

```
recipe-generator/
  backend/     Express API, MongoDB models, JWT auth, matching engine
  frontend/    React (Vite) app
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev             # starts on http://localhost:5000
```

You need a MongoDB instance — either local (`mongodb://127.0.0.1:27017/recipe_generator`)
or a free Atlas cluster (paste its connection string into `MONGO_URI`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # starts on http://localhost:5173, proxies /api to :5000
```

Open http://localhost:5173.

## How the matching engine works

`backend/utils/generateRecipe.js` compares your ingredient list against
`backend/data/recipeDataset.js`, a small seed set of recipes each tagged with
their core ingredients, cuisine, diet, macros, and steps. For each recipe it
computes `matched / required` ingredients as a percentage, filters by any
selected diet tags, and returns the closest matches along with what you're
missing. Add more entries to `recipeDataset.js` any time — the algorithm
scales to however many recipes you give it. Flip on **AI chef mode** with an
`OPENAI_API_KEY` set to generate a brand-new recipe instead of matching
against the dataset.

## Extending it further

- Swap the local dataset for a real recipe API (Spoonacular, Edamam) by
  adding a fetch step in `generateRecipe.js`.
- Add image generation per recipe using an image model.
- Add a "cook mode" that steps through instructions with built-in timers.
- Deploy backend to Render/Railway and frontend to Vercel/Netlify; point
  `CLIENT_URL`/Vite proxy at the deployed API URL.
