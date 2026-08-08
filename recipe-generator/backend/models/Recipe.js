const mongoose = require('mongoose');
const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    cuisine: String,
    diet: [{ type: String }],
    matchedIngredients: [{ type: String }],
    missingIngredients: [{ type: String }],
    ingredients: [
      {
        name: String,
        quantity: String,
      },
    ],
    steps: [{ type: String }],
    nutrition: {
      image: String,
      calories: String,
      cookingTime:String,
    },
    prepTimeMinutes: Number,
    cookTimeMinutes: Number,
    servings: Number,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, enum: ['generated', 'ai', 'custom'], default: 'generated' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);