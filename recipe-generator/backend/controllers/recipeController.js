const Recipe = require('../models/Recipe');
const User = require('../models/User');
// const { stack } = require('../routes/recipeRoutes');
// const { matchRecipesByIngredients, generateAIRecipe, buildShoppingList } = require('../utils/generateRecipe');
const { generateAIRecipe, generateAIMealPlan } = require('../utils/generateRecipe');
const MealPlan = require("../models/MealPlan");

// POST /api/recipes/generate
exports.generateRecipes = async (req, res) => {
  try {
    const { ingredients = [], diet = [] } = req.body;

    if (!ingredients.length) {
      return res.status(400).json({
        message: "Provide at least one ingredient",
      });
    }

    const recipes = await generateAIRecipe(ingredients, { diet });

    if (!recipes || recipes.length === 0) {
      return res.status(404).json({
        message: "No recipes could be generated",
      });
    }

    res.json({
      recipes: recipes,
      shoppingList: []
    });

  } catch (err) {
    console.error("Groq Error:");
    console.error(err);
    console.error(err.message);
    console.error(err.stack);

    res.status(500).json({
      message: err.message,
    });
  }
};

// POST /api/recipes/save  (persist a generated recipe, e.g. before favoriting)
exports.saveRecipe = async (req, res) => {
  try {
    console.log("REQ BODY:");
    console.log(JSON.stringify(req.body, null, 2));

    const recipe = await Recipe.create({
      ...req.body,
      createdBy: req.userId,
    });

    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
      errors: err.errors,
    });
  }
};

// POST /api/recipes/:id/favorite
exports.toggleFavorite = async (req, res) => {
  try {
    console.log("User:", req.userId);
    console.log("Recipe ID:", req.params.id);

    const recipe = await Recipe.findById(req.params.id);
    console.log("Recipe Found:", recipe);

    const user = await User.findById(req.userId);

    const idx = user.favorites.findIndex(
      (f) => f.toString() === req.params.id
    );

    if (idx > -1) {
      user.favorites.splice(idx, 1);
    } else {
      user.favorites.push(req.params.id);
    }

    await user.save();

    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
};

// GET /api/recipes/favorites
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recipes/mine
exports.getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ createdBy: req.userId }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/recipes/:id
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

//AI MEAL PLANNING
exports.generateMealPlan = async (req, res) => {
  try {
    const {
      days = 7,
      goal = "balanced",
      diet = "none",
      allergies = [],
    } = req.body;

    const mealPlan = await generateAIMealPlan({
      days,
      goal,
      diet,
      allergies,
    });

    res.json({
      success: true,
      mealPlan,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate a meal plan",
    });
  }
};

// Save feature
const saveMealPlan = async (req, res) => {
  try {
    const { days, goals, diet, allergies, mealPlan } = req.body;

    const savedMealPlan = await MealPlan.create({
      user: req.userId,
      days,
      goals,
      diet,
      allergies,
      mealPlan,
    });

    res.status(201).json({
      success: true,
      message: "Meal plan saved successfully.",
      mealPlan: savedMealPlan,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to save meal plan.",
    });
  }
};

exports.saveMealPlan = saveMealPlan;