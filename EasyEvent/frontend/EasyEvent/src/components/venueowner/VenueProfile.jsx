import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import VenueSidebar from "./VenueSidebar";

const VenueOwnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [updatedProfile, setUpdatedProfile] = useState({
    name: "",
    email: "",
    contact_number: "",
    profile_image: null,
    short_description: "",
    history: "",
    capacity: "",
    amenities: "",
    venue_images: [],
    status: "",
    last_login: "",
    date_created: "",
  });

  const accessToken = localStorage.getItem("access_token");
  const navigate = useNavigate();

  const BASE_URL = "http://localhost:8000/";

  // Helper function to convert a stored image path to a full URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    // If already a URL, return as is
    if (imagePath.startsWith("http")) return imagePath;
    // Replace backslashes with forward slashes and prepend the base URL
    return `${BASE_URL}${imagePath.replace(/\\/g, "/")}`;
  };

  // 1) Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:8000/api/venueOwner/profile",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        // Store the profile and initialize updatedProfile for editing
        setProfile(response.data);
        setUpdatedProfile({
          ...response.data,
          profile_image: null,   // so we can attach a new file if needed
          venue_images: [],      // same reasoning for multiple files
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Session expired, please login again.");
          navigate("/login");
        } else {
          toast.error("Failed to fetch profile data. Please try again.");
        }
      }
    };

    fetchProfile();
  }, [navigate, accessToken]);

  // 2) Edit / Cancel
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  // 3) Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // 4) Handle Changes in Edit Mode
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setUpdatedProfile((prevState) => ({
      ...prevState,
      profile_image: e.target.files[0],
    }));
  };

  const handleVenueImagesChange = (e) => {
    setUpdatedProfile((prevState) => ({
      ...prevState,
      venue_images: Array.from(e.target.files),
    }));
  };

  // 5) Save Changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(updatedProfile).forEach(([key, value]) => {
      // Handle multiple venue images
      if (key === "venue_images") {
        value.forEach((file) => formData.append("venue_images", file));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    try {
      // Example: PUT or POST to update
      await axios.put("http://localhost:8000/api/profile", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);

      // Update the UI with the new data
      setProfile((prevState) => ({
        ...prevState,
        ...updatedProfile,
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  // 6) Render
  if (!profile) {
    return (
      <div className="min-h-screen flex bg-gray-100">
        <VenueSidebar />
        <div className="w-full flex items-center justify-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <VenueSidebar />

      {/* Content Area */}
      <div className="flex-1 p-4 md:p-8">
        {!isEditing ? (
          /* ---------- VIEW MODE ---------- */
          <div className="bg-white rounded-md shadow p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              {/* Profile Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={getProfileImageUrl(profile.profile_image)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
                />

                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {profile.name || "USER"}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-gray-600">
                    Contact: {profile.contact_number || "N/A"}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 md:mt-0 flex space-x-2">
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Info Boxes */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Info */}
              <div className="bg-gray-50 rounded shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Status Info
                </h3>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {profile.status || "Active"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last Login:</strong> {profile.last_login || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date Created:</strong> {profile.date_created || "N/A"}
                </p>
              </div>

              {/* Bookings */}
              <div className="bg-gray-50 rounded shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Bookings
                </h3>
                <p className="text-sm text-gray-600">No bookings found.</p>
              </div>

              {/* Favorites */}
              <div className="bg-gray-50 rounded shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Favorites
                </h3>
                <p className="text-sm text-gray-600">No favorites added.</p>
              </div>

              {/* Reviews */}
              <div className="bg-gray-50 rounded shadow p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Reviews
                </h3>
                <p className="text-sm text-gray-600">No reviews found.</p>
              </div>
            </div>
          </div>
        ) : (
          /* ---------- EDIT MODE ---------- */
          <div className="bg-white rounded-md shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveChanges} className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={updatedProfile.name}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={updatedProfile.email}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="contact_number"
                  value={updatedProfile.contact_number}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              {/* Additional Info */}
              <div>
                <label className="block text-gray-700">Short Bio</label>
                <textarea
                  name="short_bio"
                  value={updatedProfile.short_description}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-gray-700">Profile Image</label>
                <input
                  type="file"
                  name="profile_image"
                  onChange={handleImageChange}
                  className="w-full p-2 rounded"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueOwnerProfile;
