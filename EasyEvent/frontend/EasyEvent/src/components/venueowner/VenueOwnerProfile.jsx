import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import VenueSidebar from "./VenueSidebar";

const VenueOwnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

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
    if (typeof imagePath !== "string") return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}${imagePath.replace(/\\/g, "/")}`;
  };

  // Function to format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  // Calculate time since account creation
  const getAccountAge = (createdAt) => {
    if (!createdAt) return "N/A";
    try {
      const created = new Date(createdAt);
      if (isNaN(created.getTime())) return "N/A";
      const now = new Date();
      const diffInMs = now - created;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 30) return `${diffInDays} days ago`;
      if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} ${months === 1 ? "month" : "months"} ago`;
      }
      const years = Math.floor(diffInDays / 365);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
    } catch (error) {
      console.error("Account age calculation error:", error);
      return "N/A";
    }
  };

  // Function to get time since last login
  const getLastLoginTime = (lastLogin) => {
    if (!lastLogin) return "Never";
    try {
      const login = new Date(lastLogin);
      if (isNaN(login.getTime())) return "Never";
      const now = new Date();
      const diffInMs = now - login;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24)
        return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30)
        return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
      return formatDate(lastLogin);
    } catch (error) {
      console.error("Last login calculation error:", error);
      return "N/A";
    }
  };

  // Fetch profile data
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
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setProfile(response.data);
      setUpdatedProfile({
        ...response.data,
        profile_image: null,
        venue_images: [],
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

  useEffect(() => {
    fetchProfile();
  }, [navigate, accessToken]);

  // Edit / Cancel
  const handleEditProfile = () => setIsEditing(true);

  // Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("access_token");
      navigate("/login");
    }
  };

  // Handle changes in edit mode
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prevState) => ({ ...prevState, [name]: value }));
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

  const validateContactNumber = (number) => {
    const nepaliPhoneRegex = /^[9][6-9]\d{8}$/;
    return nepaliPhoneRegex.test(number);
  };
  

  // Save changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(updatedProfile).forEach(([key, value]) => {
      if (key === "venue_images") {
        value.forEach((file) => formData.append("venue_images", file));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    try {
      await axios.put("http://localhost:8000/api/profile", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const venueId = localStorage.getItem("venueId");
        if (!venueId) return;
        const response = await axios.post(
          "http://localhost:8000/api/reviews/getReview",
          { venueId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReviews(response.data);
      } catch (err) {
        console.error(
          "Error fetching reviews:",
          err.response?.data || err.message
        );
        setError("Failed to load reviews");
      }
    };
    fetchReviews();
  }, []);

  // Compute overall rating
  const overallRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0";

  // Star rating component for reusability
  const StarRating = ({ rating }) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400" : "text-gray-300"
            } fill-current mr-1`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 .5l2.95 5.455 6.561.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  };

  // Get account status indicator color
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-400";
    const statusLower = status.toLowerCase();
    if (statusLower === "verified" || statusLower === "active")
      return "bg-green-500";
    if (statusLower === "pending") return "bg-yellow-500";
    if (statusLower === "rejected") return "bg-red-500";
    return "bg-gray-400";
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex bg-white">
        <VenueSidebar />
        <div className="w-full flex items-center justify-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      <VenueSidebar />
      <div className="flex-1 p-4 md:p-8">
        {!isEditing ? (
          <div className="bg-white rounded-md shadow p-6 w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              {/* Profile Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={getProfileImageUrl(profile.profile_image)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border border-gray-400"
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

            {/* Professional Account Status Card */}
            <div className="mt-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Account Status
                </h3>
                <div className="flex items-center mb-4">
                  <div
                    className={`w-4 h-4 rounded-full ${getStatusColor(
                      profile.status
                    )} mr-3`}
                  ></div>
                  <span className="text-gray-700 text-sm font-medium">
                    {profile.status || "Active"}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Account Created:</span>{" "}
                    {formatDate(profile.createdAt || profile.date_created)}{" "}
                    <span className="text-blue-500 text-[10px]">
                      (
                      {getAccountAge(profile.createdAt || profile.date_created)}
                      )
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Last Login:</span>{" "}
                    {formatDate(profile.updatedAt)}{" "}
                    <span className="text-blue-500 text-[10px]">
                      ({getLastLoginTime(profile.updatedAt)})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* CUSTOMER REVIEWS SECTION */}
            <div className="mt-6 bg-gray-50 rounded shadow p-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Customer Reviews
              </h3>
              {/* Overall Rating */}
              <div className="flex items-center mb-4">
                <span className="text-3xl font-semibold mr-2">
                  {overallRating}
                </span>
                <div className="flex">
                  <StarRating rating={Math.round(overallRating)} />
                </div>
                <span className="text-gray-600 ml-2">
                  ({reviews.length} Ratings)
                </span>
              </div>
              {/* Scrollable Review List */}
              <div className="border rounded-lg shadow-inner bg-white">
                <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {error && <p className="text-red-500">{error}</p>}
                  {reviews.length === 0 && !error && (
                    <p className="p-4 text-gray-600">No reviews available.</p>
                  )}
                  {reviews.length > 0 &&
                    reviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <a
                              href={getProfileImageUrl(review.profileImage)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={getProfileImageUrl(review.profileImage)}
                                alt={review.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            </a>
                            <span className="font-semibold text-gray-800">
                              {review.username}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="mt-2 text-gray-700">{review.review}</p>
                      </div>
                    ))}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing all {reviews.length} reviews
                </div>
              </div>
            </div>
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #c5c5c5;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #a0a0a0;
              }
            `}</style>
          </div>
        ) : (
          // Edit mode remains unchanged
          <div className="bg-white rounded-md shadow p-6 w-full">
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveChanges} className="space-y-4">
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
  {updatedProfile.contact_number && !validateContactNumber(updatedProfile.contact_number) && (
    <p className="text-red-600 text-xs mt-1">
      Contact must be 10 digits and start with 98–97
    </p>
  )}
</div>

              <div>
                <label className="block text-gray-700">Short Bio</label>
                <textarea
                  name="short_description"
                  value={updatedProfile.short_description}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Profile Image</label>
                <input
                  type="file"
                  name="profile_image"
                  onChange={handleImageChange}
                  className="w-full p-2 rounded"
                />
              </div>
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
