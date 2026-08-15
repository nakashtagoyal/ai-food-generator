import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function ReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [form, setForm] = useState({
        name: "",
        rating: 5,
        review: "",
    });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API_URL}/reviews`);
            setReviews(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${API_URL}reviews`, form);

            alert("Review submitted!");

            setForm({
                name: "",
                rating: 5,
                review: "",
            });

            fetchReviews();
        } catch (err) {
            alert("Failed to submit review");
        }
    };

    return (
    <div className="review-page">
  <div className="review-container">

    <h2>⭐ Reviews</h2>

    <form className="review-form" onSubmit={submitReview}>
      <input
        type="text"
        placeholder="Your Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <select
        value={form.rating}
        onChange={(e) =>
          setForm({ ...form, rating: Number(e.target.value) })
        }
      >
        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
        <option value="4">⭐⭐⭐⭐ (4)</option>
        <option value="3">⭐⭐⭐ (3)</option>
        <option value="2">⭐⭐ (2)</option>
        <option value="1">⭐ (1)</option>
      </select>

      <textarea
        rows="6"
        placeholder="Write your review..."
        value={form.review}
        onChange={(e) =>
          setForm({ ...form, review: e.target.value })
        }
      />

      <button type="submit">
        Submit Review
      </button>
    </form>

</div>

<div className="reviews-section">

  <h2>What Users Say:</h2>
<div className="reviews-grid">
  {reviews.map((review) => (
    <div key={review._id} className="review-card">
      <h3>{review.name}</h3>

      <p>{"⭐".repeat(review.rating)}</p>

      <p>{review.review}</p>

      <small>
        {new Date(review.createdAt).toLocaleDateString()}
      </small>

      <hr />
    </div>
   
  ))}

 </div>


  </div>
</div>
    );
}

export default ReviewPage;