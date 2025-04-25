// src/components/ReviewForm.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import MiniLogin from "./MiniLogin";

const ReviewForm = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showLogin, setShowLogin] = useState(false);

  // Get bookingId from the URL parameters
  const { bookingId } = useParams();

  // Show login modal if token is missing
  useEffect(() => {
    if (!token) {
      setShowLogin(true);
    }
  }, [token]);

  // On login modal close, update token if available
  const handleLoginClose = () => {
    const newToken = localStorage.getItem("token");
    if (newToken) {
      setToken(newToken);
      setShowLogin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure user is logged in before submitting
    if (!token) {
      toast.error("Please log in to submit your review.");
      setShowLogin(true);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/reviews/submit",
        { bookingId, rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Review submitted successfully!");
    } catch (error) {
      console.error(
        "Review submission error:",
        error.response?.data || error.message
      );
      toast.error("Error submitting review");
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-md">
        <h2 className="text-lg font-bold mb-4">Rate the Venue</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Rating (0-10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <label className="block mb-2">Review</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </form>
      </div>

      {/* MiniLogin Modal */}
      <MiniLogin show={showLogin} onClose={handleLoginClose} />
    </>
  );
};

export default ReviewForm;
