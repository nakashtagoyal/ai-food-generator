import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function MyRecipes() {
    const [showModal, setShowModal] = useState(false);
    const [recipe, setRecipe] = useState({
        title: "",
        description: "",
        image: "",
        cuisine: "",
        cookingTime: "",
        calories: "",
        difficulty: "easy",
        dietTags: [],
        ingredients: [
            { name: "", quantity: "" }
        ],
        steps: [""]
    });

    const [recipes, setRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                `${API_URL}/recipes/mine`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setRecipes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setRecipe({
            ...recipe,
            [e.target.name]: e.target.value,
        });
    };

    const addIngredient = () => {
        setRecipe({
            ...recipe,
            ingredients: [
                ...recipe.ingredients,
                { name: "", quantity: "" },
            ],
        });
    };

    const addStep = () => {
        setRecipe({
            ...recipe,
            steps: [...recipe.steps, ""],
        });
    };

    const updateIngredient = (index, field, value) => {
        const updated = [...recipe.ingredients];
        updated[index][field] = value;

        setRecipe({
            ...recipe,
            ingredients: updated,
        });
    };

    const updateStep = (index, value) => {
        const updated = [...recipe.steps];
        updated[index] = value;

        setRecipe({
            ...recipe,
            steps: updated,
        });
    };

    const deleteRecipe = async (id) => {
        if (!window.confirm("Delete this recipe?")) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `${API_URL}/recipes/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSelectedRecipe(null);
            fetchRecipes();
        } catch (err) {
            console.error(err);
            alert("Failed to delete recipe");
        }
    };

    return (
        <div className="my-recipes-page">

            <div className="my-recipes-header">
                <h1>My Recipes</h1>

                <button
                    className="new-recipe-btn"
                    onClick={() => setShowModal(true)}
                >
                    + New Recipe
                </button>
            </div>

            <div className="my-recipes-grid">

                {recipes.length === 0 ? (

                    <div className="empty-recipes">
                        <h2>No recipes yet 🍳</h2>
                        <p>Create your first recipe.</p>
                    </div>

                ) : (

                    recipes.map((item, index) => (

                        <div className="my-recipe-card" key={index} onClick={() => setSelectedRecipe(item)}>

                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="recipe-image"
                                />
                            )}

                            <h2>{item.title}</h2>

                            <p>{item.description}</p>

                            <div className="recipe-info">

                                <span>🍽 {item.cuisine}</span>

                                <span>🔥 {item.calories} Cal</span>

                                <span>⏱ {item.cookingTime}</span>

                                <span>⭐ {item.difficulty}</span>

                            </div>

                        </div>

                    ))

                )}

            </div>

            {showModal && (
                <div
                    className="recipe-modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="recipe-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="recipe-modal-header">
                            <h2>Create New Recipe</h2>

                            <button
                                className="close-modal"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            className="recipe-form"
                            onSubmit={async (e) => {
                                e.preventDefault();

                                try {
                                    const token = localStorage.getItem("token");

                                    await axios.post(
                                        `${API_URL}/recipes/save`,
                                        recipe,
                                        {
                                            headers: {
                                                Authorization: `Bearer ${token}`,
                                            },
                                        }
                                    );

                                    await fetchRecipes();

                                    setRecipe({
                                        title: "",
                                        description: "",
                                        image: "",
                                        cuisine: "",
                                        cookingTime: "",
                                        calories: "",
                                        difficulty: "easy",
                                        dietTags: [],
                                        ingredients: [{ name: "", quantity: "" }],
                                        steps: [""],
                                    });

                                    setShowModal(false);
                                } catch (err) {
                                    // console.error(err);
                                    // alert("Failed to save recipe");
                                    console.log(err.response?.data);
                                    alert(err.response?.data?.message);
                                }
                            }}
                        >
                            <input
                                placeholder="Recipe title"
                                value={recipe.title}
                                onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
                            />

                            <textarea
                                placeholder="Short description"
                                value={recipe.description}
                                onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
                            />

                            <input
                                placeholder="Image URL"
                                value={recipe.image}
                                onChange={(e) => setRecipe({ ...recipe, image: e.target.value })}
                            />

                            <input
                                placeholder="Cuisine"
                                value={recipe.cuisine}
                                onChange={(e) => setRecipe({ ...recipe, cuisine: e.target.value })}
                            />

                            <input
                                placeholder="Cooking Time"
                                value={recipe.cookingTime}
                                onChange={(e) => setRecipe({ ...recipe, cookingTime: e.target.value })}
                            />

                            <input
                                placeholder="Calories"
                                value={recipe.calories}
                                onChange={(e) => setRecipe({ ...recipe, calories: e.target.value })}
                            />

                            <select
                                value={recipe.difficulty}
                                onChange={(e) => setRecipe({ ...recipe, difficulty: e.target.value })}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>

                            <h3>Ingredients</h3>

                            {recipe.ingredients.map((ingredient, index) => (
                                <div key={index}>
                                    <input
                                        placeholder="Ingredient"
                                        value={ingredient.name}
                                        onChange={(e) =>
                                            updateIngredient(index, "name", e.target.value)
                                        }
                                    />

                                    <input
                                        placeholder="Quantity"
                                        value={ingredient.quantity}
                                        onChange={(e) =>
                                            updateIngredient(index, "quantity", e.target.value)
                                        }
                                    />
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addIngredient}
                            >
                                + Add Ingredient
                            </button>

                            <textarea
                                placeholder="Steps (write one step per line)"
                                value={recipe.steps.join("\n")}
                                onChange={(e) =>
                                    setRecipe({
                                        ...recipe,
                                        steps: e.target.value.split("\n").filter(step => step.trim() !== ""),
                                    })
                                }
                            />

                            <button type="submit" className="new-recipe-btn">
                                Publish Recipe
                            </button>
                        </form>

                    </div>
                </div>
            )}

            {selectedRecipe && (
                <div
                    className="recipe-modal-overlay"
                    onClick={() => setSelectedRecipe(null)}
                >
                    <div
                        className="recipe-modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="recipe-modal-header">
                            <h2>{selectedRecipe.title}</h2>

                            <button
                                className="close-modal"
                                onClick={() => setSelectedRecipe(null)}
                            >
                                ✕
                            </button>
                        </div>

                        {selectedRecipe.image && (
                            <img
                                src={selectedRecipe.image}
                                alt={selectedRecipe.title}
                                className="recipe-image"
                            />
                        )}

                        <p>{selectedRecipe.description}</p>

                        <div className="recipe-info">
                            <span>🍽 {selectedRecipe.cuisine}</span>
                            <span>🔥 {selectedRecipe.calories} Cal</span>
                            <span>⏱ {selectedRecipe.cookingTime}</span>
                            <span>⭐ {selectedRecipe.difficulty}</span>
                        </div>

                        <h3>Ingredients</h3>

                        <ul>
                            {selectedRecipe.ingredients?.map((ingredient, index) => (
                                <li key={index}>
                                    {ingredient.name} - {ingredient.quantity}
                                </li>
                            ))}
                        </ul>

                        <h3>Steps</h3>

                        <ol>
                            {selectedRecipe.steps?.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>

                        <button
                            className="delete-recipe-btn"
                            onClick={() => deleteRecipe(selectedRecipe._id)}
                        >
                            🗑 Delete Recipe
                        </button>
                    </div>
                </div>
            )}

        </div >
    );
}

