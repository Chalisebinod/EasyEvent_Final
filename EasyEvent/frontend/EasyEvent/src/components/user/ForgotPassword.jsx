import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      // Send POST request to the backend to initiate OTP generation
      const response = await axios.post(
        "http://localhost:8000/api/forgot-password",
        { email }
      );

      if (response.status === 200) {
        setMessage(response.data.message); // Success message from backend
        navigate("/email-verification", { state: { email } });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Send OTP to this email
          </button>
        </form>
        {message && (
          <p className="text-center mt-4 text-sm text-green-500 font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="text-center mt-4 text-sm text-red-500 font-medium">
            {error}
          </p>
        )}
        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-blue-500 hover:underline text-sm font-medium"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
