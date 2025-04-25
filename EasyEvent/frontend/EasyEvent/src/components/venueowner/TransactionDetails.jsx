import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEnvelope, FaPhoneAlt, FaArrowLeft } from "react-icons/fa";
import VenueSidebar from "./VenueSidebar";

function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for demonstration
  const transaction = {
    id,
    userName: "John Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    profileImage: "https://via.placeholder.com/100",
    totalPayment: "$2,000.00",
    remainingAmount: "$200.00",
    paymentMethod: "Credit Card (**** 2300)",
    date: "14.09.2015 00:00",
    status: "Partial",
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="sticky top-0 h-screen bg-white shadow-md">
        <VenueSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Container for spacing */}
        <div className="max-w-screen-2xl mx-auto p-6 md:p-8">
         

          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-400 text-white rounded-xl p-6 md:p-8 shadow-lg mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              Payment Details
            </h1>
            <p className="text-sm md:text-base text-red-100">
              Transaction ID: {transaction.id}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: User Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="flex items-center gap-6 mb-6">
                <img
                  src={transaction.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
                />
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                    {transaction.userName}
                  </h2>
                  <div className="flex items-center text-gray-600 text-sm mt-2">
                    <FaEnvelope className="mr-2 text-red-500" />
                    {transaction.email}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mt-2">
                    <FaPhoneAlt className="mr-2 text-green-500" />
                    {transaction.phone}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <span className="font-semibold">Billing Date:</span>{" "}
                  {transaction.date}
                </p>
                <p>
                  <span className="font-semibold">Payment Method:</span>{" "}
                  {transaction.paymentMethod}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={
                      transaction.status === "Fully"
                        ? "text-green-600"
                        : transaction.status === "No"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  >
                    {transaction.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Right Column: Payment Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
                Payment Summary
              </h2>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Total Payment:</span>
                <span className="text-gray-900">
                  {transaction.totalPayment}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">
                  Remaining Amount:
                </span>
                <span className="text-gray-900">
                  {transaction.remainingAmount}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Last Updated:</span>
                <span className="text-gray-900">2 days ago</span>
              </div>
              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
                <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md shadow">
                  Send Reminder
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md shadow">
                  View Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TransactionDetails;
