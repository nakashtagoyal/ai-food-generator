import React from 'react';
import {jsPDF} from "jspdf";
import axios from 'axios';
import QRCode from "qrcode";

export default function RecipeDetail({ recipe, onClose }) {
  if (!recipe) return null;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const text = `${recipe.title}\n\nIngredients:\n${(recipe.ingredients || []).map((i) => `- ${i.quantity} ${i.name}`)
      .join('\n')}\n\nSteps:\n${(recipe.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    if (navigator.share) {
      try { await navigator.share({ title: recipe.title, text }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Recipe copied to clipboard');
    }
  };

const handleDownloadPDF = async () => {
  const doc = new jsPDF();

  const qrData = await QRCode.toDataURL(
  `Recipe: ${recipe.title}

Description:
${recipe.description || ""}

Ingredients:
${(recipe.ingredients || [])
  .map(i => `${i.quantity} ${i.name}`)
  .join(", ")}

Steps:
${(recipe.steps || []).join(" | ")}`
);

  // Add recipe image
if (recipe.image) {
  try {
    const response = await axios.get(recipe.image, {
      responseType: "blob",
    });

    const blob = response.data;

    const reader = new FileReader();

    const imageLoaded = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
    });

    reader.readAsDataURL(blob);

    const image = await imageLoaded;

    doc.addImage(image, "JPEG", 55, 30, 100, 60);

  } catch (err) {
    console.log("Couldn't load image for PDF");
  }
}

  // Header
doc.setFillColor(34, 139, 34); // Forest Green
doc.rect(0, 0, 210, 25, "F");

doc.setTextColor(255, 255, 255);
doc.setFontSize(22);
doc.text("AI Recipe Generator", 10, 16);

doc.setTextColor(0, 0, 0);

let y = 100;

// Add QR Code
doc.addImage(qrData, "PNG", 155, 35, 35, 35);

  // Title
  doc.setFontSize(20);
  doc.text(recipe.title, 10, y);
  doc.setDrawColor(34, 139, 34);
  doc.line(10, y + 3, 200, y + 3);

  y += 12;

  // Description
doc.setFontSize(12);
const description = doc.splitTextToSize(
  recipe.description || "",
  130
);

doc.text(description, 10, y);

y += description.length * 7 + 5;

// Recipe Information
doc.setFontSize(14);
doc.text("Recipe Information", 10, y);

y += 8;

doc.setFontSize(11);
doc.text(`Cuisine: ${recipe.cuisine || "N/A"}`, 10, y);
y += 7;

doc.text(`Difficulty: ${recipe.difficulty || "N/A"}`, 10, y);
y += 7;

doc.text(
  `Prep Time: ${recipe.prepTimeMinutes || 0} mins`,
  10,
  y
);
y += 7;

doc.text(
  `Cook Time: ${recipe.cookTimeMinutes || 0} mins`,
  10,
  y
);
y += 12;

 // =====================
// Ingredients
// =====================
doc.setFontSize(16);
doc.setTextColor(0, 102, 0); // Dark Green
doc.text("Ingredients", 10, y);

y += 10;

doc.setTextColor(0, 0, 0);
doc.setFontSize(12);

(recipe.ingredients || []).forEach((ing, index) => {
  doc.text(
    `${index + 1}. ${ing.quantity} ${ing.name}`,
    15,
    y
  );
  y += 8;
});

y += 5;

// Steps
doc.setFontSize(16);
doc.text("Steps", 10, y);

y += 10;

(recipe.steps || []).forEach((step, index) => {
  doc.text(`${index + 1}. ${step}`, 12, y);
  y += 8;

  if (y > 270) {
    doc.addPage();
    y = 20;
    doc.setTextColor(0,0,0);
  }
});

//Footer
doc.setFontSize(10);
doc.setTextColor(120);

doc.text(
  "Generated using AI Recipe Generator",
  10,
  290
);

doc.text(
  new Date().toLocaleDateString(),
  170,
  290
);

doc.save(`${recipe.title}.pdf`);

};

  return (
    <div className="recipe-detail">
      <div className="card-top">
        <h3>{recipe.title}</h3>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
      <p>{recipe.description}</p>

      {recipe.nutrition && (
        <div className="nutrition-strip">
          <div><b>{recipe.nutrition.calories}</b>kcal</div>
          <div><b>{recipe.nutrition.protein}g</b>protein</div>
          <div><b>{recipe.nutrition.carbs}g</b>carbs</div>
          <div><b>{recipe.nutrition.fat}g</b>fat</div>
        </div>
      )}

      <h4>Ingredients</h4>
      <ul className="ingredient-list">
        {(recipe.ingredients || []).map((ing, idx) => (
          <li key={idx}>
            <span>{ing.name}</span>
            <span className="qty">{ing.quantity}</span>
          </li>
        ))}
      </ul>

      <h4>Steps</h4>
      <ol className="step-list">
        {(recipe.steps || []).map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ol>

      <div className="card-actions">
        <button className="btn-primary" onClick={handleShare}>Share recipe</button>
        <button className="btn-ghost" onClick={handlePrint}>Print</button>
        <button className="btn-ghost" onClick={handleDownloadPDF}>Download PDF</button>
      </div>
    </div>
  );
}
