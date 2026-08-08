const axios = require("axios");
require("dotenv").config();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const dataset = require('../data/recipeDataset');

const normalize = (str) => str.trim().toLowerCase();

/**
 * Scores every recipe in the dataset against the ingredients the user has on
 * hand, and returns ranked matches with what's missing so the UI can show a
 * "you're 80% there" style result plus a shopping list for the gap.
 */
function matchRecipesByIngredients(userIngredients = [], { diet = [], maxResults = 6 } = {}) {
  const have = new Set(userIngredients.map(normalize));

  const scored = dataset.map((recipe) => {
    const required = recipe.baseIngredients.map(normalize);
    const matched = required.filter((ing) => have.has(ing));
    const missing = required.filter((ing) => !have.has(ing));
    const score = required.length ? matched.length / required.length : 0;

    return {
      ...recipe,
      matchedIngredients: matched,
      missingIngredients: missing,
      matchScore: Math.round(score * 100),
    };
  });

  const filteredByDiet = diet.length
    ? scored.filter((r) => diet.some((d) => r.diet.includes(normalize(d))))
    : scored;

  return filteredByDiet
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.missingIngredients.length - b.missingIngredients.length)
    .slice(0, maxResults);
}

/**
 * Optional: if OPENAI_API_KEY is set in .env, this generates a fully custom,
 * novel recipe from the user's ingredients via an LLM instead of (or in
 * addition to) the local dataset matcher. Falls back gracefully if no key.
 */

async function generateAIRecipe(userIngredients = [], { diet = [] } = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env")
  }
  const prompt = `
You are an expert chef.

Available ingredients:
${userIngredients.join(", ")}

Diet: ${diet.join(", ") || "None"}

Generate ALL possible recipes that can reasonably be made using these ingredients.

Rules:
- Use the provided ingredients as the main ingredients.
- You may include common pantry items like salt, pepper, water, cooking oil, butter, and basic spices if necessary.
- If an important ingredient is missing, mention it in the recipe description.
- Return as many different recipes as possible.
- Do NOT create duplicate or very similar recipes.

Return ONLY valid JSON in this format:

{
  "recipes": [
    {
      "title": "",
      "description": "",
      "ingredients": [
        {
          "name": "",
          "quantity": ""
        }
      ],
      "steps": [""],
      "prepTimeMinutes": 0,
      "cookTimeMinutes": 0,
      "servings": 0,
      "difficulty": "",
      "cuisine": ""
    }
  ]
}
`;
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );
    const text = response.data.choices[0].message.content;

    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Remove everything before the first {
    cleaned = cleaned.substring(cleaned.indexOf("{"));

    // Remove everything after the last }
    cleaned = cleaned.substring(0, cleaned.lastIndexOf("}") + 1);

    let data;

    try {
      data = JSON.parse(cleaned);
    } catch (err) {
      console.error("Invalid JSON received from Groq:");
      console.log(cleaned);
      throw new Error("Groq returned invalid JSON");
    }

    for (const recipe of data.recipes) {
      recipe.image = await getRecipeImage(recipe.title);
      console.log(recipe.title, recipe.image);
    }

    return data.recipes;

  }
  catch (err) {
    console.error("Groq Error:");
    console.error(err.response?.data || err.message);
    throw new Error("Unable to generate recipes");
  }
}

/** Builds a shopping list from missing ingredients across selected recipes. */
function buildShoppingList(recipes = []) {
  const list = new Set();
  recipes.forEach((r) => r.missingIngredients?.forEach((i) => list.add(i)));
  return Array.from(list);
}

async function getRecipeImage(recipeName) {
  try {
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(recipeName)}&per_page=1`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY,
        },
      }
    );

    if (response.data.photos.length > 0) {
      return response.data.photos[0].src.large;
    }

    return "";
  } catch (error) {
    console.error("Pexels Error:", error.message);
    return "";
  }
}

// =========================
// AI MEAL PLAN CHUNK
// =========================
async function generateMealPlanChunk({
  days = 7,
  goal = "balanced",
  diet = "none",
  allergies = [],
}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  const prompt = `
You are an expert nutritionist and professional chef.

Create a unique ${days}-day meal plan.

Goal: ${goal}
Diet: ${diet}
Allergies: ${allergies.join(", ") || "None"}

Rules:
- Every day must be different.
- Breakfast, Lunch, Dinner and Snack.
- Never repeat meals.
- Never use allergic ingredients.
- Return ONLY valid JSON.
- No markdown.
- No explanation.

Return:

{
  "mealPlan":[
    {
      "day":1,
      "breakfast":{
        "name":"",
        "ingredients":[{"name":"","quantity":""}],
        "instructions":["","",""],
        "prepTime":"10 mins",
        "cookTime":"15 mins",
        "calories":350
      },
      "lunch":{
        "name":"",
        "ingredients":[{"name":"","quantity":""}],
        "instructions":["","",""],
        "prepTime":"15 mins",
        "cookTime":"20 mins",
        "calories":550
      },
      "dinner":{
        "name":"",
        "ingredients":[{"name":"","quantity":""}],
        "instructions":["","",""],
        "prepTime":"20 mins",
        "cookTime":"25 mins",
        "calories":600
      },
      "snack":{
        "name":"",
        "ingredients":[{"name":"","quantity":""}],
        "instructions":["",""],
        "prepTime":"5 mins",
        "cookTime":"0 mins",
        "calories":180
      }
    }
  ]
}
`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const text = response.data.choices[0].message.content;

    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    cleaned = cleaned.substring(cleaned.indexOf("{"));
    cleaned = cleaned.substring(0, cleaned.lastIndexOf("}") + 1);

    const data = JSON.parse(cleaned);

    return data.mealPlan;

  } catch (err) {

    if (err.response) {
      console.log("STATUS:", err.response?.status);
      console.log(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }

    throw err;
  }
}

// =========================
// COMPLETE AI MEAL PLAN
// =========================
async function generateAIMealPlan({
  days = 7,
  goal = "balanced",
  diet = "none",
  allergies = [],
}) {

  const mealPlan = [];

  for (let i = 0; i < days; i += 7) {

    const chunkDays = Math.min(7, days - i);

    const chunk = await generateMealPlanChunk({
      days: chunkDays,
      goal,
      diet,
      allergies,
    });

    mealPlan.push(...chunk);

    // Wait 3 seconds before the next Groq request
    if (i + 7 < days) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  mealPlan.forEach((day, index) => {
    day.day = index + 1;
  });

  return mealPlan;
}

module.exports = {
  matchRecipesByIngredients,
  generateAIRecipe,
  buildShoppingList,
  generateAIMealPlan,
};

