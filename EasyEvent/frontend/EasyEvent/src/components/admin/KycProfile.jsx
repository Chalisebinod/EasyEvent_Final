import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const KycProfile = () => {
  const { kycId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For updating verification status
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState(null);

  // For image modal viewing
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    axios
      .get(`http://localhost:8000/api/kyc/profile/${kycId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        const data = response.data;
        if (data.data) {
          setProfile(data.data);
        } else {
          setError(data.error || "Error fetching profile");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching profile");
        setLoading(false);
      });
  }, [kycId]);

  const handleUpdate = (e) => {
    e.preventDefault();
    const accessToken = localStorage.getItem("access_token");
    // Reset previous errors
    setUpdateError(null);

    axios
      .put(
        "http://localhost:8000/api/kyc/verify",
        {
          kycId,
          status: updateStatus,
          message: updateStatus === "rejected" ? updateMessage : null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        const data = response.data;
        if (data.error) {
          setUpdateError(data.error);
          toast.error(data.error, {
            position: "top-right",
            theme: "colored",
          });
        } else {
          // Show a toast notification based on the update status.
          if (updateStatus === "approved") {
            toast.success("KYC accepted successfully", {
              position: "top-right",
              theme: "colored",
            });
          } else if (updateStatus === "rejected") {
            toast.error("KYC rejected successfully", {
              position: "top-right",
              theme: "colored",
            });
          }
          // Update the profile locally for immediate feedback.
          setProfile((prev) => ({
            ...prev,
            status: updateStatus, // now update the property that UI displays
            rejectMsg: updateStatus === "rejected" ? updateMessage : null,
          }));
          
          // Navigate to admin dashboard after status update
          setTimeout(() => {
            navigate("/admin-dashboard");
          }, 2000); // 2 seconds delay to allow user to see the toast notification
        }
      })
      .catch((err) => {
        setUpdateError("Error updating status");
        toast.error("Error updating status", {
          position: "top-right",
          theme: "colored",
        });
      });
  };

  // Handler to open modal with the selected image URL
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Handler to close the modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Helper to prepend base URL if needed (adjust if your backend serves static files)
  const getImageUrl = (path) => {
    if (path && path.startsWith("http")) {
      return path;
    }
    return `http://localhost:8000/${path}`; // Adjust base URL as needed
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow ml-64 p-8 bg-white min-h-screen">
        <ToastContainer />
        {loading ? (
          <p className="text-gray-700">Loading profile...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-8">KYC Profile Details</h2>

            {/* Top Section: Personal Info & Venue Details */}
            <div className="bg-white shadow-lg rounded-lg p-8 mb-8 flex flex-col md:flex-row justify-between">
              <div className="flex items-center flex-1">
                <div className="w-40 h-40 flex-shrink-0 mr-8">
                  {profile.profileImage &&
                  profile.profileImage.trim() !== "" ? (
                    <img
                      src={getImageUrl(profile.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full border cursor-pointer"
                      onClick={() =>
                        openImageModal(getImageUrl(profile.profileImage))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full border">
                      <span className="text-gray-600">No Image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">
                    {profile.venueOwnerName}
                  </h3>
                  <p className="text-gray-700">
                    <strong>Phone:</strong> {profile.phoneNumber}
                  </p>
                  <p className="text-gray-700">
                    <strong>Email:</strong> {profile.email}
                  </p>
                  <p className="mt-2">
                    <span
                      className={`px-3 py-1 inline-block text-sm font-semibold rounded-full ${
                        profile.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : profile.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {profile.status}
                    </span>
                    {profile.status === "rejected" && (
                      <span className="ml-4 text-red-600">
                        (Reason: {profile.rejectMsg})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {/* Venue Details Card */}
              <div className="bg-gray-50 shadow-md rounded-lg p-4 mt-4 md:mt-0 md:ml-8 w-full md:w-1/3">
                <h3 className="text-xl font-semibold mb-2">Venue Details</h3>
                <p>
                  <strong>Venue Name:</strong> {profile.venueName}
                </p>
                <p className="mt-2">
                  <strong>Address:</strong>{" "}
                  {`${profile.venueAddress.address}, ${profile.venueAddress.city}, ${profile.venueAddress.state}, ${profile.venueAddress.zip_code}`}
                </p>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
              <h3 className="text-2xl font-semibold mb-6">Documents</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-medium text-sm mb-2">Citizenship Front:</p>
                  {profile.citizenshipFront !== "No file uploaded" ? (
                    <img
                      src={getImageUrl(profile.citizenshipFront)}
                      alt="Citizenship Front"
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() =>
                        openImageModal(getImageUrl(profile.citizenshipFront))
                      }
                    />
                  ) : (
                    <p className="text-xs text-gray-500">No file uploaded</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Citizenship Back:</p>
                  {profile.citizenshipBack !== "No file uploaded" ? (
                    <img
                      src={getImageUrl(profile.citizenshipBack)}
                      alt="Citizenship Back"
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() =>
                        openImageModal(getImageUrl(profile.citizenshipBack))
                      }
                    />
                  ) : (
                    <p className="text-xs text-gray-500">No file uploaded</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">PAN Document:</p>
                  {profile.pan !== "No file uploaded" ? (
                    <img
                      src={getImageUrl(profile.pan)}
                      alt="PAN Document"
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() => openImageModal(getImageUrl(profile.pan))}
                    />
                  ) : (
                    <p className="text-xs text-gray-500">No file uploaded</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Map:</p>
                  {profile.map !== "No map file uploaded" ? (
                    <img
                      src={getImageUrl(profile.map)}
                      alt="Map"
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() => openImageModal(getImageUrl(profile.map))}
                    />
                  ) : (
                    <p className="text-xs text-gray-500">
                      No map file uploaded
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Signature:</p>
                  {profile.signature !== "No signature uploaded" ? (
                    <img
                      src={getImageUrl(profile.signature)}
                      alt="Signature"
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() =>
                        openImageModal(getImageUrl(profile.signature))
                      }
                    />
                  ) : (
                    <p className="text-xs text-gray-500">
                      No signature uploaded
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Venue Images:</p>
                  {profile.venueImages &&
                  Array.isArray(profile.venueImages) &&
                  profile.venueImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {profile.venueImages.map((imgUrl, index) => (
                        <img
                          key={index}
                          src={getImageUrl(imgUrl)}
                          alt={`Venue Image ${index + 1}`}
                          className="w-full h-40 object-cover rounded cursor-pointer"
                          onClick={() => openImageModal(getImageUrl(imgUrl))}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No venue images uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Update Verification Section - Conditionally rendered based on status */}
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-6">
                {profile.status === "pending" ? "Update Verification Status" : "Verification Status"}
              </h3>
              
              {profile.status === "pending" ? (
                <form onSubmit={handleUpdate}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {updateStatus === "rejected" && (
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        Rejection Message
                      </label>
                      <textarea
                        value={updateMessage}
                        onChange={(e) => setUpdateMessage(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter rejection message"
                        required
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Update Verification
                  </button>
                </form>
              ) : profile.status === "approved" ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-medium text-lg">
                    Status: <span className="font-bold">Approved</span>
                  </p>
                </div>
              ) : profile.status === "rejected" ? (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700 font-medium text-lg">
                    Status: <span className="font-bold">Rejected</span>
                  </p>
                  <p className="text-red-600 mt-2">
                    Reason: {profile.rejectMsg}
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeImageModal}
        >
          <div className="relative">
            <img
              src={selectedImage}
              alt="Full view"
              className="max-w-full max-h-screen rounded-lg shadow-xl"
            />
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-800 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycProfile;