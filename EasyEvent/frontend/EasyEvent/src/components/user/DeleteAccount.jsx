import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar"; // Assuming this is your Navbar component
import BottomNavbar from "./BottomNavbar"; // Assuming this is your BottomNavbar component

const DeleteAccount = () => {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("access_token");

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action is irreversible."
      )
    ) {
      try {
        await axios.delete("http://localhost:8000/api/delete-account", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        alert("Account deleted successfully!");
  
        navigate("/"); // Redirect to the home page after account deletion
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 p-6">
        {/* Sidebar (Options Section) */}
        <div className="hidden md:flex flex-col bg-white shadow-lg rounded-lg p-4 w-1/4">
          <h3 className="text-lg font-semibold text-gray-800">Options</h3>
          <ul className="mt-4 space-y-2">
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/user-profile")} // Navigate to Profile page
            >
             Profile
            </li>
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/change-password")} // Navigate to Change Password page
            >
              Change Password
            </li>
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/payment-details")} // Navigate to Payment Details page
            >
              Payment Details
            </li>
            <li
              className="cursor-pointer p-2 bg-gray-100 rounded hover:bg-orange-100"
              onClick={() => navigate("/delete-account")} // Navigate to Delete Account page
            >
              Delete Account
            </li>
          </ul>
        </div>

        {/* Delete Account Confirmation */}
        <div className="flex-1 ml-4">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-red-600">
              Delete Account
            </h2>
            <p>
              Are you sure you want to delete your account? This action is
              irreversible.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default DeleteAccount;
