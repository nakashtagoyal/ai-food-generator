import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const API_URL = import.meta.env.VITE_API_URL;

//Generate meal plan
function MealPlannerPage() {
  const [days, setDays] = useState(7);
  const [goals, setGoals] = useState([]);
  const [diet, setDiet] = useState("none");
  const [allergies, setAllergies] = useState("");
  const [mealPlan, setMealPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const generateMealPlan = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/recipes/meal-plan`,
        {
          days,
          goals,
          diet,
          allergies: allergies
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMealPlan(res.data.mealPlan);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate meal plan");
    } finally {
      setLoading(false);
    }
  };

  //Save meal plan button
  const saveMealPlan = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/recipes/save-meal-plan`,
        {
          days,
          goals,
          diet,
          allergies: allergies
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          mealPlan,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Meal plan saved successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save meal plan");
    }
  };

  //Share meal plan button
  const shareMealPlan = async () => {
    const text = mealPlan
      .map(
        (day) => `
Day ${day.day}

🍳 Breakfast: ${day.breakfast.name}

Ingredients:
${day.breakfast.ingredients
            .map(i => `- ${i.quantity} ${i.name}`)
            .join("\n")}

Instructions:
${day.breakfast.instructions
            .map((s, i) => `${i + 1}. ${s}`)
            .join("\n")}


🥗 Lunch: ${day.lunch.name}

Ingredients:
${day.lunch.ingredients
            .map(i => `- ${i.quantity} ${i.name}`)
            .join("\n")}

Instructions:
${day.lunch.instructions
            .map((s, i) => `${i + 1}. ${s}`)
            .join("\n")}


🍽 Dinner: ${day.dinner.name}

Ingredients:
${day.dinner.ingredients
            .map(i => `- ${i.quantity} ${i.name}`)
            .join("\n")}

Instructions:
${day.dinner.instructions
            .map((s, i) => `${i + 1}. ${s}`)
            .join("\n")}


🍎 Snack: ${day.snack.name}

Ingredients:
${day.snack.ingredients
            .map(i => `- ${i.quantity} ${i.name}`)
            .join("\n")}

Instructions:
${day.snack.instructions
            .map((s, i) => `${i + 1}. ${s}`)
            .join("\n")}
`
      )
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Meal Plan",
          text,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Meal plan copied to clipboard!");
    }
  };

  //Print meal plan button
  const printMealPlan = () => {
    const printWindow = window.open("", "_blank");

    const content = mealPlan
      .map(
        (day) => `
      <h2>Day ${day.day}</h2>

      ${["breakfast", "lunch", "dinner", "snack"]
            .map(
              (meal) => `
          <h3>${meal.charAt(0).toUpperCase() + meal.slice(1)} - ${day[meal].name
                }</h3>

          <p><b>Prep:</b> ${day[meal].prepTime}
          | <b>Cook:</b> ${day[meal].cookTime}
          | <b>Calories:</b> ${day[meal].calories}</p>

          <h4>Ingredients</h4>
          <ul>
            ${day[meal].ingredients
                  .map(
                    (i) =>
                      `<li>${i.quantity} ${i.name}</li>`
                  )
                  .join("")}
          </ul>

          <h4>Instructions</h4>
          <ol>
            ${day[meal].instructions
                  .map((s) => `<li>${s}</li>`)
                  .join("")}
          </ol>
          <hr>
        `
            )
            .join("")}
    `
      )
      .join("");

    printWindow.document.write(`
    <html>
      <head>
        <title>Meal Plan</title>
      </head>
      <body>
        <h1>AI Meal Plan</h1>
        ${content}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.print();
  };

  //Download PDF meal plan button
  const downloadPDF = async () => {
    const doc = new jsPDF();
    const qrData = await QRCode.toDataURL(
      window.location.href
    );

    // Header background
    doc.setFillColor(34, 139, 34); // Forest Green
    doc.rect(0, 0, 210, 28, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AI Meal Planner", 15, 18);

    // QR Code
    doc.addImage(qrData, "PNG", 165, 4, 35, 35);

    // Back to black text
    doc.setTextColor(0, 0, 0);

    let y = 45;

    // Summary
    const totalCalories = mealPlan.reduce((total, day) => {
      return total +
        day.breakfast.calories +
        day.lunch.calories +
        day.dinner.calories +
        day.snack.calories;
    }, 0);

    doc.setFontSize(15);
    doc.text("Meal Plan Summary", 15, y);

    y += 8;

    doc.setFontSize(12);
    doc.text(`Days: ${mealPlan.length}`, 15, y);
    y += 7;

    doc.text(`Total Meals: ${mealPlan.length * 4}`, 15, y);
    y += 7;

    doc.text(`Estimated Calories: ${totalCalories} kcal`, 15, y);
    y += 12;

    mealPlan.forEach((day) => {
      doc.setFontSize(15);
      doc.text(`Day ${day.day}`, 15, y);
      y += 10;

      ["breakfast", "lunch", "dinner", "snack"].forEach((meal) => {
        const m = day[meal];

        // Estimate required height
        let requiredHeight = 35;

        m.ingredients.forEach((i) => {
          const lines = doc.splitTextToSize(
            `• ${i.quantity} ${i.name}`,
            170
          );
          requiredHeight += lines.length * 6;
        });

        m.instructions.forEach((step, index) => {
          const lines = doc.splitTextToSize(
            `${index + 1}. ${step}`,
            170
          );
          requiredHeight += lines.length * 8;
        });

        // Start a new page BEFORE printing the meal
        if (y + requiredHeight > 270) {
          doc.addPage();

          doc.setFillColor(34, 139, 34);
          doc.rect(0, 0, 210, 28, "F");

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.text("AI Meal Planner", 15, 18);

          doc.addImage(qrData, "PNG", 165, 4, 35, 35);

          doc.setTextColor(0, 0, 0);

          y = 45;
        }

        doc.setFontSize(13);
        doc.text(`${meal.toUpperCase()} : ${m.name}`, 15, y);
        y += 7;

        doc.text(`Prep: ${m.prepTime} | Cook: ${m.cookTime}`, 15, y);
        y += 7;

        doc.text(`Calories: ${m.calories}`, 15, y);
        y += 7;

        doc.text("Ingredients:", 15, y);
        y += 6;

        m.ingredients.forEach((i) => {
          const lines = doc.splitTextToSize(
            `• ${i.quantity} ${i.name}`,
            170
          );
          doc.text(lines, 20, y);
          y += lines.length * 6;
        });

        doc.text("Instructions:", 15, y);
        y += 6;

        m.instructions.forEach((step, index) => {
          const lines = doc.splitTextToSize(
            `${index + 1}. ${step}`,
            170
          );
          doc.text(lines, 20, y);
          y += lines.length * 6 + 2;
        });

        y += 10;
      });
    });

    //Footer
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setFontSize(10);
      doc.setTextColor(120);

      doc.text(
        "Generated using AI Meal Planner",
        15,
        285
      );

      doc.text(
        new Date().toLocaleDateString(),
        165,
        285
      );

      doc.text(
        `Page ${i} of ${totalPages}`,
        90,
        285
      );
    }

    doc.save("MealPlan.pdf");
  };

  return (
    <div className="meal-planner-page">
      <div className="planner-header">
        <h1>🍽️ AI Meal Planner</h1>
        <p>
          Create personalized meal plans based on your nutrition goals, diet preferences and allergies.
        </p>
      </div>
      <div className="planner-layout">
        <div className="planner-form">
          <div style={{ marginBottom: "20px" }}>
            <label>Days</label>
            <br />
            <input
              type="number"
              value={days}
              min="1"
              max="31"
              onChange={(e) => setDays(Number(e.target.value))}
            />

            <br />
            <br />

            <label>Goals</label>

            <div className="goal-checkboxes">
              {[
                "Balanced",
                "Weight Loss",
                "Muscle Gain",
                "High Protein",
                "Low Carb",
                "Keto",
                "Heart Healthy",
                "Diabetic Friendly",
                "High Fiber",
                "Budget Friendly",
                "Quick Meals",
                "Meal Prep",
              ].map((goal) => (
                <label key={goal} className="goal-option">
                  <input
                    type="checkbox"
                    checked={goals.includes(goal)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGoals([...goals, goal]);
                      } else {
                        setGoals(goals.filter((g) => g !== goal));
                      }
                    }}
                  />
                  <span> {goal} </span>
                </label>
              ))}
            </div>

            <br />
            <br />

            <label>Diet</label>
            <br />
            <select value={diet} onChange={(e) => setDiet(e.target.value)}>
              <option value="none">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="non-vegetarian">Non Vegetarian</option>
              <option value="gluten-free">Gluten Free</option>
              <option value="dairy-free">Dairy Free</option>
              <option value="pescatarian">Pescatarian</option>
            </select>

            <br />
            <br />

            <label>Allergies (comma separated)</label>
            <br />
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Peanuts, Milk"
            />
            <br />
            <br />
            <button onClick={generateMealPlan} disabled={loading}>
              {loading ? "Generating..." : "Generate Meal Plan"}
            </button>
          </div>
        </div>
        <div className="planner-preview">
          <h3>Today's Preferences</h3>
          <p>
            📅 <strong>{days}</strong> Day Plan
          </p>
          <p>
            🎯{" "}
            {goals.length
              ? goals.join(", ")
              : "Balanced"}
          </p>
          <p>
            🥗 {diet}
          </p>

          <p>
            ⚠ {allergies || "No allergies"}
          </p>
        </div>
      </div>

      {mealPlan.length > 0 && (
        <div className="meal-plan-results">
          <h2>Your Meal Plan</h2>

          {mealPlan.map((day) => (
            <div key={day.day} className="meal-card">
              <h3>Day {day.day}</h3>

              <p><strong>🍳 Breakfast:</strong> {day.breakfast.name}</p>
              <p><strong>🥗 Lunch:</strong> {day.lunch.name}</p>
              <p><strong>🍽 Dinner:</strong> {day.dinner.name}</p>
              <p><strong>🍎 Snack:</strong> {day.snack.name}</p>

              <button
                className="view-recipe-btn"
                onClick={() => {
                  setSelectedDay(day);
                  setShowRecipeModal(true);
                }}
              >
                View Recipes
              </button>
            </div>
          ))}

          <div className="meal-plan-actions">
            <button className="save-btn" onClick={saveMealPlan}>💾 Save</button>
            <button className="share-btn" onClick={shareMealPlan}>📤 Share</button>
            <button className="print-btn" onClick={printMealPlan}>🖨 Print</button>
            <button className="pdf-btn" onClick={downloadPDF}>📄 Download PDF</button>
          </div>
        </div>
      )}
      {showRecipeModal && selectedDay && (
        <div
          className="recipe-modal-overlay"
          onClick={() => setShowRecipeModal(false)}
        >
          <div
            className="recipe-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Day {selectedDay.day} Recipes</h2>

            {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
              <div key={meal} style={{ marginBottom: "30px" }}>
                <h3>
                  {meal.charAt(0).toUpperCase() + meal.slice(1)} :
                  {" "}
                  {selectedDay[meal].name}
                </h3>

                <p>
                  ⏱ {selectedDay[meal].prepTime} | 🍳{" "}
                  {selectedDay[meal].cookTime}
                </p>

                <p>🔥 {selectedDay[meal].calories} Calories</p>

                <h4>Ingredients</h4>

                <ul>
                  {selectedDay[meal].ingredients.map((item, index) => (
                    <li key={index}>
                      {item.quantity} {item.name}
                    </li>
                  ))}
                </ul>

                <h4>Instructions</h4>

                <ol>
                  {selectedDay[meal].instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>

                <hr />
              </div>
            ))}

            <button
              className="close-modal-btn"
              onClick={() => setShowRecipeModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlannerPage;