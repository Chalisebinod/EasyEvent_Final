import React, { useState, useEffect, useRef } from "react";
import { FaUserEdit, FaSignOutAlt, FaCamera, FaCalendarAlt, FaClock, FaUser } from "react-icons/fa";
import Navbar from "./Navbar";
import BottomNavbar from "./BottomNavbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const BASE_URL = "http://localhost:8000/";

// Helper function to convert a stored image path to a full URL
const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/150";
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}${imagePath.replace(/\\/g, "/")}`;
};

// Validation function for Nepali phone numbers
const validateContactNumber = (number) => {
  const nepaliPhoneRegex = /^(\+977)?[9][6-9]\d{8}$/; // Regex for Nepali phone numbers
  return nepaliPhoneRegex.test(number);
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({
    name: "",
    email: "",
    contact_number: "",
    profile_image: null,
  });
  const fileInputRef = useRef(null);

  const accessToken = localStorage.getItem("access_token");
  const navigate = useNavigate();

  // Logout confirmation handlers
  const confirmLogout = () => setShowLogoutConfirmation(true);
  const cancelLogout = () => setShowLogoutConfirmation(false);
  const handleLogout = () => {
    toast.info("Logging out...");
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}api/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProfile(response.data);
        setUpdatedProfile({
          name: response.data.name || "",
          email: response.data.email || "",
          contact_number: response.data.contact_number || "",
          profile_image: null,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.response && error.response.status === 401) {
          toast.error("Session expired, please login again.");
          navigate("/login");
        } else {
          toast.error("Failed to fetch profile data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, navigate]);

  // Switch to edit mode
  const handleEditProfile = () => setIsEditing(true);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection using optional chaining
  const handleImageChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      setUpdatedProfile((prev) => ({ ...prev, profile_image: file }));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Save changes to profile
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", updatedProfile.name);
    formData.append("email", updatedProfile.email);
    formData.append("contact_number", updatedProfile.contact_number);
    if (updatedProfile.profile_image) {
      formData.append("profile_image", updatedProfile.profile_image);
    }
    try {
      toast.info("Updating profile...");
      await axios.put(`${BASE_URL}api/profile/update`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Profile updated successfully!");
      const updatedResponse = await axios.get(`${BASE_URL}api/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(updatedResponse.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-5xl w-full mx-auto p-6 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading your profile...</p>
          </div>
        ) : profile ? (
          <div className="bg-white rounded-xl shadow-xl p-8 relative transition-all duration-300 hover:shadow-2xl border border-gray-100">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
              {/* Profile Image */}
              <div className="flex-shrink-0 mb-6 md:mb-0 relative">
                <div className="p-1 rounded-full ">
                  <img
                    src={getProfileImageUrl(profile.profile_image)}
                    alt="Profile"
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-gray-500"
                  />
                </div>
              </div>

              {/* Name & Basic Info */}
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                  {profile.name || "User"}
                </h1>
                <p className="text-gray-500 text-lg mb-3">
                  {profile.email || "user@gmail.com"}
                </p>
                {profile.contact_number && (
                  <p className="mb-2 text-gray-600 font-medium flex items-center justify-center md:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {profile.contact_number}
                  </p>
                )}
                {profile.location && (
                  <p className="mb-4 text-gray-600 font-medium flex items-center justify-center md:justify-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {profile.location}
                  </p>
                )}
                {/* Edit & Logout Buttons */}
                <div className="mt-4 flex flex-wrap space-x-4 justify-center md:justify-start">
                  <button
                    onClick={handleEditProfile}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all"
                  >
                    <FaUserEdit className="mr-2" />
                    Edit Profile
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 focus:ring-4 focus:ring-red-300 focus:outline-none transition-all"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-b border-gray-200"></div>

            {/* Status Info Box */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-6 border border-gray-100 transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                Profile Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center bg-white p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-gray-800">{profile.status || "Not Provided"}</p>
                  </div>
                </div>
                {/* <div className="flex items-center bg-white p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <FaClock className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="font-medium text-gray-800">{formatDate(profile.last_login)}</p>
                  </div>
                </div> */}
                <div className="flex items-center bg-white p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <FaCalendarAlt className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium text-gray-800">{formatDate(profile.date_created)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 text-lg">Unable to load profile data</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* EDIT PROFILE MODAL */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Edit Your Profile</h2>
              </div>
              <form onSubmit={handleSaveChanges} className="p-6">
                <div className="flex justify-center mb-6">
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <div className="rounded-full overflow-hidden border-4 border-gray-200 w-32 h-32 transition-all duration-300 group-hover:border-blue-400">
                      <img
                        src={
                          updatedProfile.profile_image && updatedProfile.profile_image instanceof File
                            ? URL.createObjectURL(updatedProfile.profile_image)
                            : profile && profile.profile_image
                            ? getProfileImageUrl(profile.profile_image)
                            : "https://via.placeholder.com/150"
                        }
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 shadow-lg transition-transform transform group-hover:scale-110">
                      <FaCamera className="text-white" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-medium">Change Photo</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <input type="file" name="profile_image" onChange={handleImageChange} ref={fileInputRef} className="hidden" accept="image/*" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={updatedProfile.name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={updatedProfile.email}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
  <input
    type="text"
    name="contact_number"
    value={updatedProfile.contact_number}
    onChange={handleInputChange}
    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    placeholder="Enter your phone number"
  />
  {!validateContactNumber(updatedProfile.contact_number) &&
    updatedProfile.contact_number && (
      <p className="text-red-600 text-xs mt-1">
        Contact number must be a valid Nepali phone number (e.g., +97798XXXXXXXX or 98XXXXXXXX).
      </p>
    )}
</div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LOGOUT CONFIRMATION MODAL */}
        {showLogoutConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FaSignOutAlt className="mr-2" />
                  Confirm Logout
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-700 text-lg">Are you sure you want to log out of your account?</p>
                  <p className="text-gray-500 mt-2">You will need to sign in again to access your profile.</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelLogout}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
                  >
                    <FaSignOutAlt className="mr-2" />
                    Yes, Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </div>
  );
};

export default Profile;
