const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateRecipes,
  saveRecipe,
  toggleFavorite,
  getFavorites,
  getMyRecipes,
  generateMealPlan,
  saveMealPlan,
  deleteRecipe,
} = require('../controllers/recipeController');

// Public: anyone can generate recipes without an account
router.post('/generate', generateRecipes);

// Protected: require login
router.post('/save', auth, saveRecipe);
router.post('/:id/favorite', auth, toggleFavorite);
router.get('/favorites', auth, getFavorites);
router.get('/mine', auth, getMyRecipes);
router.post("/meal-plan", auth, generateMealPlan);
router.post("/save-meal-plan", auth, saveMealPlan);
router.delete("/:id", auth, deleteRecipe);

module.exports = router;