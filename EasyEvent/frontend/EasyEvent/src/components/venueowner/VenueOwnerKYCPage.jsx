import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VenueOwnerKYCPage = () => {
  const navigate = useNavigate();

  // --- State for the KYC Upload Form ---
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [venueImages, setVenueImages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate exactly 2 or 3 images selected
    if (venueImages.length < 2 || venueImages.length > 3) {
      alert("Please select exactly 2 or 3 images.");
      return;
    }

    try {
      // Prepare form data with the exact field names expected by your backend
      const formData = new FormData();
      formData.append("venueName", venueName);

      const venueAddressObj = {
        address,
        city,
        state: stateName,
        zip_code: zipCode,
      };
      formData.append("venueAddress", JSON.stringify(venueAddressObj));

      // Append each selected image file with the field name "venueImages"
      for (let i = 0; i < venueImages.length; i++) {
        formData.append("venueImages", venueImages[i]);
      }

      // Send the form data to your backend endpoint (adjust URL if needed)
      const response = await axios.post("/api/kyc/updateKYC", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("KYC updated successfully:", response.data);
      alert("KYC updated successfully!");

      // Navigate to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error updating KYC:", error);
      alert(error?.response?.data?.error || "Error updating KYC");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-md">
        <div className="text-3xl font-extrabold text-orange-500">EasyEvents</div>
      </header>

      {/* Main Section */}
      <main className="container mx-auto py-16 px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-4xl font-bold text-orange-500 text-center mb-6">
            Complete Your KYC Verification
          </h2>
          <p className="text-lg text-gray-700 text-center mb-8">
            To start listing and managing your venues, please upload your
            documents for KYC verification. This step is crucial to ensure trust
            and transparency on our platform.
          </p>

          {/* Benefits Section */}
          <div className="bg-gray-100 p-6 rounded-lg mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Benefits of KYC Verification
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Feature your venue in top search results</li>
              <li>Earn trust with verified badges for your listings</li>
              <li>Enable secure and seamless online payments</li>
              <li>Access detailed analytics of customer interactions</li>
              <li>Increase visibility and engagement with potential clients</li>
            </ul>
          </div>

          {/* Existing Call to Action */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate("/kyc-upload")}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full shadow-md hover:bg-orange-600 transition duration-300"
            >
              Upload Documents for KYC
            </button>
          </div>

          {/* --- Integrated KYC Upload Form --- */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Resubmit KYC Documents
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Venue Name</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter your venue name"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="State"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="12345"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Venue Images (2 or 3)
                </label>
                <input
                  type="file"
                  name="venueImages"
                  multiple
                  onChange={(e) => setVenueImages(e.target.files)}
                  className="block w-full text-sm text-gray-500
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-orange-50 file:text-orange-700
                             hover:file:bg-orange-100"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">
                  Please select exactly 2 or 3 images.
                </p>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full shadow-md hover:bg-orange-600 transition duration-300"
              >
                Submit KYC
              </button>
            </form>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-6">
            What You Can Do After KYC Verification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">
                List Your Venues
              </h4>
              <p className="text-gray-700">
                Add detailed profiles for your venues, including photos, pricing,
                and capacity.
              </p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">
                Manage Bookings
              </h4>
              <p className="text-gray-700">
                Accept, decline, or manage booking requests seamlessly in real
                time.
              </p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">
                Receive Secure Payments
              </h4>
              <p className="text-gray-700">
                Ensure smooth financial transactions with secure payment gateways.
              </p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">
                Analytics Dashboard
              </h4>
              <p className="text-gray-700">
                Gain insights into customer behavior and venue performance
                through analytics.
              </p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">
                Real-Time Messaging
              </h4>
              <p className="text-gray-700">
                Communicate directly with clients to negotiate bookings or clarify requirements.
              </p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h4 className="text-xl font-bold text-orange-500 mb-4">
                Build Reputation
              </h4>
              <p className="text-gray-700">
                Enhance your credibility with verified listings and positive client reviews.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VenueOwnerKYCPage;
