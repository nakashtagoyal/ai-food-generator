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

Generate as many UNIQUE and realistic recipes as possible using the provided ingredients.

Try to generate up to 20 recipes.

If fewer than 20 genuinely different recipes can reasonably be created, return only the realistic recipes.

Do not force recipes just to reach 20.
Do not generate duplicate or very similar recipes.
Each recipe should have a clearly different main preparation or cooking style.

Rules:
- Use the provided ingredients as the main ingredients.
- You may include common pantry items like salt, pepper, water, cooking oil, butter, and basic spices if necessary.
- If an important ingredient is missing, mention it in the recipe description.
- Return as many different recipes as possible.
- Do NOT create duplicate or very similar recipes.
- Each recipe should be meaningfully different.
- Respect the user's diet preferences.
- Do not force recipes just to reach 20.
- difficulty MUST be exactly one of: "easy", "medium", "hard"
- Use lowercase only.

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
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        },

        reasoning_format: "hidden",

        temperature: 0.7,

        max_completion_tokens: 12000
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

    // Normalize difficulty to match MongoDB enum
    for (const recipe of data.recipes) {
      if (recipe.difficulty) {
        recipe.difficulty = recipe.difficulty.toLowerCase();
      }
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
    throw new Error("GROQ_API_KEY is missing");
  }

  const prompt = `
You are an expert nutritionist and professional chef.

Create a ${days}-day meal plan.

Goal: ${goal}
Diet: ${diet}
Allergies: ${allergies.join(", ") || "None"}

IMPORTANT RULES:
- Create exactly ${days} days.
- Every day must contain breakfast, lunch, dinner and snack.
- Never repeat meals.
- Never use allergic ingredients.
- Respect the diet.
- Return ONLY JSON.
- Do not include markdown.
- Do not include explanations.
- The top-level JSON object MUST contain a property called "mealPlan".
- "mealPlan" MUST be an array.
- The array MUST contain exactly ${days} objects.
`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: "openai/gpt-oss-20b",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        response_format: {
          type: "json_schema",
          json_schema: {
            name: "meal_plan",
            strict: true,

            schema: {
              type: "object",

              properties: {
                mealPlan: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      day: {
                        type: "integer",
                      },

                      breakfast: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },

                          ingredients: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: {
                                  type: "string",
                                },
                                quantity: {
                                  type: "string",
                                },
                              },
                              required: ["name", "quantity"],
                              additionalProperties: false,
                            },
                          },

                          instructions: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },

                          prepTime: {
                            type: "string",
                          },

                          cookTime: {
                            type: "string",
                          },

                          calories: {
                            type: "integer",
                          },
                        },

                        required: [
                          "name",
                          "ingredients",
                          "instructions",
                          "prepTime",
                          "cookTime",
                          "calories",
                        ],

                        additionalProperties: false,
                      },

                      lunch: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },

                          ingredients: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: {
                                  type: "string",
                                },
                                quantity: {
                                  type: "string",
                                },
                              },
                              required: ["name", "quantity"],
                              additionalProperties: false,
                            },
                          },

                          instructions: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },

                          prepTime: {
                            type: "string",
                          },

                          cookTime: {
                            type: "string",
                          },

                          calories: {
                            type: "integer",
                          },
                        },

                        required: [
                          "name",
                          "ingredients",
                          "instructions",
                          "prepTime",
                          "cookTime",
                          "calories",
                        ],

                        additionalProperties: false,
                      },

                      dinner: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },

                          ingredients: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: {
                                  type: "string",
                                },
                                quantity: {
                                  type: "string",
                                },
                              },
                              required: ["name", "quantity"],
                              additionalProperties: false,
                            },
                          },

                          instructions: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },

                          prepTime: {
                            type: "string",
                          },

                          cookTime: {
                            type: "string",
                          },

                          calories: {
                            type: "integer",
                          },
                        },

                        required: [
                          "name",
                          "ingredients",
                          "instructions",
                          "prepTime",
                          "cookTime",
                          "calories",
                        ],

                        additionalProperties: false,
                      },

                      snack: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },

                          ingredients: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: {
                                  type: "string",
                                },
                                quantity: {
                                  type: "string",
                                },
                              },
                              required: ["name", "quantity"],
                              additionalProperties: false,
                            },
                          },

                          instructions: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },

                          prepTime: {
                            type: "string",
                          },

                          cookTime: {
                            type: "string",
                          },

                          calories: {
                            type: "integer",
                          },
                        },

                        required: [
                          "name",
                          "ingredients",
                          "instructions",
                          "prepTime",
                          "cookTime",
                          "calories",
                        ],

                        additionalProperties: false,
                      },
                    },

                    required: [
                      "day",
                      "breakfast",
                      "lunch",
                      "dinner",
                      "snack",
                    ],

                    additionalProperties: false,
                  },
                },
              },

              required: ["mealPlan"],
              additionalProperties: false,
            },
          },
        },

        // Keep reasoning simple for this generation task
        reasoning_format: "hidden",
        reasoning_effort: "low",

        temperature: 0.2,

        max_completion_tokens: 16000,
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("=================================");
    console.log("GROQ STATUS:", response.status);
    console.log("=================================");

    const message = response.data?.choices?.[0]?.message;

    console.log("GROQ MESSAGE:", JSON.stringify(message, null, 2));

    const text = message?.content;

    if (!text) {
      throw new Error("Groq returned an empty response");
    }

    console.log("GROQ RAW CONTENT:");
    console.log(text);

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON PARSE ERROR:");
      console.error(parseError);
      console.error("RAW GROQ CONTENT:");
      console.error(text);

      throw new Error("Groq returned invalid JSON");
    }

    console.log("PARSED GROQ DATA:");
    console.log(JSON.stringify(data, null, 2));

    if (!data || !Array.isArray(data.mealPlan)) {
      console.error("EXPECTED mealPlan ARRAY BUT GOT:");
      console.error(JSON.stringify(data, null, 2));

      throw new Error(
        "Groq response does not contain mealPlan array"
      );
    }

    if (data.mealPlan.length !== days) {
      console.warn(
        `Expected ${days} days but Groq returned ${data.mealPlan.length}`
      );
    }

    return data.mealPlan;

  } catch (err) {

    console.error("========== GROQ ERROR ==========");

    if (err.response) {
      console.error("STATUS:", err.response.status);

      console.error(
        "DATA:",
        JSON.stringify(err.response.data, null, 2)
      );
    } else {
      console.error("MESSAGE:", err.message);
      console.error(err.stack);
    }

    console.error("================================");

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