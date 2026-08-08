const Review = require("../models/Review");

// Add a new review
const addReview = async (req, res) => {
  try {
    const { name, rating, review } = req.body;

    const newReview = new Review({
      name,
      rating,
      review,
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully!",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get all reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  addReview,
  getReviews,
};