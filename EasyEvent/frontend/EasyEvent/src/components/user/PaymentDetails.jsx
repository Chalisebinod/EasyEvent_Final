import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar"; // Assuming this is your Navbar component
import BottomNavbar from "./BottomNavbar"; // Assuming this is your BottomNavbar component

const PaymentDetails = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [paymentData, setPaymentData] = useState({
    khalti_number: "",
    esewa_number: "",
  });
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    navigate("/login");
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handlePaymentDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:8000/api/payment-details",
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      alert("Payment details saved successfully!");
    } catch (error) {
      console.error("Error saving payment details:", error);
      alert("Failed to save payment details.");
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

        {/* Payment Details Form */}
        <div className="flex-1 ml-4">
          <div className="p-6">
            <h2 className="text-xl font-semibold">Payment Details</h2>
            <form onSubmit={handlePaymentDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700">Khalti Number</label>
                <input
                  type="text"
                  name="khalti_number"
                  value={paymentData.khalti_number}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Esewa Number</label>
                <input
                  type="text"
                  name="esewa_number"
                  value={paymentData.esewa_number}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition"
              >
                Save Payment Details
              </button>
            </form>
          </div>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default PaymentDetails;
