import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const UserSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validate email domains: allow .com, .edu.np, .org, .net, .np
  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|edu\.np|org|net|np)$/;
    return emailRegex.test(email);
  };

  // Validate password criteria: at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.
  const validatePassword = (pwd) => {
    const strengthChecks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    return Object.values(strengthChecks).every(Boolean);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      toast.error("Invalid email domain. Allowed: .com, .edu.np, .org, .net, .np");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error("Password does not meet requirements!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/signup",
        formData
      );

      if (response.status === 201) {
        toast.success("Signup successful! Please log in.");
        setFormData({ name: "", email: "", password: "" });

        // Add a delay before navigation
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-white">
      <ToastContainer />
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
          <p className="text-gray-600 text-sm">
            Sign up to start planning your events
          </p>
        </div>

        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-gray-700 mb-2 font-medium text-sm"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="John doe"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 mb-2 font-medium text-sm"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="john@hmail.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
              required
            />
            {formData.email && !validateEmail(formData.email) && (
              <p className="text-red-600 text-xs mt-1">
                Please enter a valid email (e.g., user@gmail.com or user@domain.edu.np).
              </p>
            )}
          </div>
          <div className="mb-5 relative">
            <label
              htmlFor="password"
              className="block text-gray-700 mb-2 font-medium text-sm"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? (
                  <EyeIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
            {formData.password && !validatePassword(formData.password) && (
              <p className="text-red-600 text-xs mt-2">
                Password must be 8+ characters, include uppercase, lowercase,
                number, and special character.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 rounded-lg text-white font-medium transition duration-300 ${
              isSubmitting
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account? {" "}
            <Link
              to="/login"
              className="text-orange-600 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSignup;
