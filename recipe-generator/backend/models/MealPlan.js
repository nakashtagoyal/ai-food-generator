const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    name: String,
    ingredients: [
      {
        name: String,
        quantity: String,
      },
    ],
    instructions: [String],
    prepTime: String,
    cookTime: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,

  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    days: Number,
    goals: [String],
    diet: String,
    allergies: [String],

    mealPlan: [
      {
        day: Number,
        breakfast: mealSchema,
        lunch: mealSchema,
        dinner: mealSchema,
        snack: mealSchema,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MealPlan", mealPlanSchema);