import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import MiniLogin from "./MiniLogin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * A simple star rating input component (interactive).
 */
function StarRatingInput({ rating, onRatingChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={star <= rating ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={`w-8 h-8 ${
              star <= rating ? "text-yellow-400" : "text-gray-400"
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 
              0l2.019 6.22a1 1 0 00.95.69h6.545c.969 
              0 1.371 1.24.588 1.81l-5.3 3.846a1 
              1 0 00-.364 1.118l2.019 6.22c.3.922-.755 
              1.688-1.54 1.118l-5.3-3.846a1 1 0 
              00-1.176 0l-5.3 3.846c-.785.57-1.84-.196-1.54-1.118l2.02-6.22a1 
              1 0 00-.364-1.118l-5.3-3.846c-.783-.57-.38-1.81.588-1.81h6.545a1 
              1 0 00.95-.69l2.02-6.22z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function SubmitReview() {
  const { bookingId } = useParams();
  console.log("checking booking id ", bookingId)
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access_token")
  );
  const [showLogin, setShowLogin] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
const navigate = useNavigate()
  // Prompt login if no access token
  useEffect(() => {
    if (!accessToken) {
      setShowLogin(true);
    }
  }, [accessToken]);

  const handleLoginClose = () => {
    setShowLogin(false);
    const token = localStorage.getItem("access_token");
    if (token) {
      setAccessToken(token);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Please log in to submit your review.");
      setShowLogin(true);
      return;
    }

    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/reviews/submit",
        { bookingId: bookingId, rating, review: comment },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(response.data.message || "Review submitted successfully!");
      setSuccess(true);
      setRating(0);
      setComment("");
      navigate("/user-dashboard")
    } catch (err) {
      console.error(
        "Review submission error:",
        err.response?.data || err.message
      );
      toast.error(err.response?.data.message || "Error submitting review");
      setError(err.response?.data.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="bg-white p-6 rounded-md shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Thank You!</h1>
          <p className="text-gray-700 mb-2">
            Your review has been submitted successfully.
          </p>
          <p className="text-gray-500">
            We appreciate your feedback and hope to serve you again!
          </p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
        <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-4 text-gray-800">
            Submit Your Review
          </h1>
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-gray-700 font-medium">
              Your Rating
            </label>
            <StarRatingInput rating={rating} onRatingChange={setRating} />
            {rating === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please select a star rating.
              </p>
            )}

            <label className="block mt-6 mb-2 text-gray-700 font-medium">
              Your Review
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:border-orange-400"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
            ></textarea>

            {error && <p className="text-red-500 mt-2">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="mt-4 px-4 py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>

      {/* MiniLogin Modal */}
      <MiniLogin show={showLogin} onClose={handleLoginClose} />
      <ToastContainer />
    </>
  );
}

export default SubmitReview;
