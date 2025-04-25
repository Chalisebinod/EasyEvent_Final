import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Navbar from "./Navbar";
import BottomNavbar from "./BottomNavbar";

const ChangePassword = () => {
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const accessToken = localStorage.getItem("access_token");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    try {
      await axios.put(
        "http://localhost:8000/api/change-password",
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex flex-1 p-6">
        <div className="hidden md:flex flex-col bg-white shadow-lg rounded-lg p-4 w-1/4">
          <h3 className="text-lg font-semibold text-gray-800">Options</h3>
          <ul className="mt-4 space-y-2">
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/user-profile")}
            >
              Profile
            </li>
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/change-password")}
            >
              Change Password
            </li>
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/payment-details")}
            >
              Payment Details
            </li>
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/delete-account")}
            >
              Delete Account
            </li>
          </ul>
        </div>
        <div className="flex-1 ml-4">
          <div className="p-6">
            <h2 className="text-xl font-semibold">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { label: "Old Password", name: "old_password", field: "old" },
                { label: "New Password", name: "new_password", field: "new" },
                {
                  label: "Confirm New Password",
                  name: "confirm_password",
                  field: "confirm",
                },
              ].map(({ label, name, field }) => (
                <div key={name} className="relative">
                  <label className="block text-gray-700">{label}</label>
                  <input
                    type={showPassword[field] ? "text" : "password"}
                    name={name}
                    value={passwordData[name]}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded pr-10"
                  />
                  <span
                    className="absolute right-3 top-10 cursor-pointer"
                    onClick={() => togglePasswordVisibility(field)}
                  >
                    {showPassword[field] ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              ))}
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default ChangePassword;
