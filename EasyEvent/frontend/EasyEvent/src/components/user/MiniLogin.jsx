import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const MiniLogin = ({ show, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Don't show anything if 'show' prop is false
  if (!show) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        email,
        password,
      });
      toast.success(response.data.message);

      // Save token in local storage
      const token = response.data.token;
      localStorage.setItem("access_token", token);

      // Optionally store venue ID if role === 'venueOwner'
      if (response.data.role === "venueOwner" && response.data.venueId) {
        localStorage.setItem("venueId", response.data.venueId);
      }

      // Simply close the modal - no navigation
      onClose();
    } catch (error) {
      toast.error("Login failed!");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Close if user clicks outside the modal
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Prevent close on child click
      >
        {/* Close button (optional) */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-orange-500 mb-4 text-center">
          Login
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your Credentials to access your account
        </p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="email"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                placeholder="password"
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? (
                  <EyeIcon className="w-6 h-6 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="w-6 h-6 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition duration-200"
          >
            Login
          </button>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default MiniLogin;
