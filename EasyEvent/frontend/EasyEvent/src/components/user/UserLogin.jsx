import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        email,
        password,
      });
  
      toast.success(response.data.message);
      const token = response.data.token;
      localStorage.setItem("access_token", token);
  
      const redirectUrl = localStorage.getItem("redirect_after_login");
      localStorage.removeItem("redirect_after_login");
  
      if (redirectUrl && redirectUrl !== "/login") {
        navigate(redirectUrl, { replace: true });
      } else if (response.data.role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (response.data.role === "venueOwner") {
        localStorage.setItem("venueId", response.data.venueId);
        navigate("/venue-owner-dashboard", { replace: true });
      } else {
        navigate("/user-dashboard", { replace: true });
      }
    } catch (error) {
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "Login failed!";
      
      // Display the error message (e.g., for blocked users)
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600 text-sm">
            Enter your credentials to access your account
          </p>
        </div>

        <form className="w-full" onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2 text-sm">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2 text-sm">
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
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
                  <EyeIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end items-center mb-6">
            <Link to="/forgotpassword" className="text-orange-600 hover:underline text-sm">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Don't have an account?
          </p>
          <div className="flex justify-center gap-4 mt-2">
  <Link
    to="/user-signup"
    className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg text-sm font-medium transition duration-300 hover:bg-orange-600 hover:text-white shadow-sm hover:shadow-md"
  >
    Signup as User
  </Link>
  <Link
    to="/venue-owner-signup"
    className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg text-sm font-medium transition duration-300 hover:bg-orange-600 hover:text-white shadow-sm hover:shadow-md"
  >
    Signup as Venue Owner
  </Link>
</div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserLogin;