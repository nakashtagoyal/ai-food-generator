import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import AuthModal from './components/AuthModal.jsx';
import RecipeGeneratorPage from './pages/RecipeGeneratorPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import MealPlannerPage from './pages/MealPlannerPage.jsx';
import Footer from './components/Footer.jsx';
import ContactPage from './pages/ContactPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import MyRecipes from './pages/MyRecipes.jsx';

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <Navbar onAuthOpen={() => setAuthOpen(true)} />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<RecipeGeneratorPage onAuthOpen={() => setAuthOpen(true)} />} />
          <Route path="/favorites" element={<FavoritesPage onAuthOpen={() => setAuthOpen(true)} />} />
          <Route path="/meal-planner" element={<MealPlannerPage />} />
          <Route path="/contact" element={<ContactPage />} />
             <Route path="/reviews" element={<ReviewPage />} />
               <Route path="/myrecipes" element={<MyRecipes />} />
        </Routes>
      </main>
      <Footer/>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
