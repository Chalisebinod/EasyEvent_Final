import React, { useEffect, useState, forwardRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Dashboard as DashboardIcon,
  RequestQuote as RequestQuoteIcon,
  Event as EventIcon,
  Payments as PaymentsIcon,
  AccountBalance as AccountBalanceIcon,
  AccountCircle as ProfileIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Image as GalleryIcon,
  VerifiedUser as KycIcon,
} from "@mui/icons-material";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import RateReviewIcon from "@mui/icons-material/RateReview";
import Slide from "@mui/material/Slide";

// Logout Dialog Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const VenueSidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  // Fetch venue owner profile to get the user ID
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const response = await axios.get(
          "http://localhost:8000/api/venueOwner/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserId(response.data._id);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          "http://localhost:8000/api/notification/getUnreads",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotificationCount(response.data.count || 0);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const openLogoutDialog = () => setLogoutDialogOpen(true);
  const closeLogoutDialog = () => setLogoutDialogOpen(false);

  // Menu items configuration
  const menuItems = [
    { path: "/venue-owner-dashboard", icon: <DashboardIcon className="w-5 h-5" />, label: "Dashboard" },
    { path: "/user-request", icon: <RequestQuoteIcon className="w-5 h-5" />, label: "Request" },
    { path: "/bookings-owner", icon: <BookOnlineIcon className="w-5 h-5" />, label: "Bookings" },
    { path: "/foodManagement", icon: <AccountBalanceIcon className="w-5 h-5" />, label: "Food Management" },
    { path: "/halls", icon: <StoreIcon className="w-5 h-5" />, label: "Halls" },
    { 
      path: "/notification", 
      icon: (
        <div className="relative">
          <NotificationsIcon className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </div>
      ), 
      label: "Notifications" 
    },
    { path: "/transaction", icon: <PaymentsIcon className="w-5 h-5" />, label: "Payments" },
    { path: "/agreement", icon: <AccountBalanceIcon className="w-5 h-5" />, label: "Agreement" },
    { path: "/chat", icon: <EventIcon className="w-5 h-5" />, label: "Chat" },
    { path: `/venueOwner-profile/${userId}`, icon: <ProfileIcon className="w-5 h-5" />, label: "Profile" },
    { path: "/venueOwnerKyc", icon: <KycIcon className="w-5 h-5" />, label: "KYC" },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 fixed h-full">
  <div className="h-full flex flex-col bg-black shadow-xl">
    {/* Logo/Brand */}
    <div className="p-6 flex justify-center">
      <div className="bg-black bg-opacity-10 px-4 py-3 rounded-lg">
        <h1 className="text-2xl font-bold tracking-wide text-white">
          <span className="text-yellow-400">Easy</span>Event
        </h1>
      </div>
    </div>

    {/* Navigation Links */}
    <div className="px-4 py-2 flex-grow overflow-y-auto">
      <ul className="space-y-1">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-15px transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-white text-black font-medium shadow-md"
                  : "text-green-100 hover:bg-green-800"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>

    {/* Logout Button */}
    <div className="p-4 border-t border-green-800">
      <button
        onClick={openLogoutDialog}
        className="w-full flex items-center px-4 py-3 text-green-100 hover:bg-green-800 rounded-lg transition-colors duration-200"
      >
        <LogoutIcon className="w-5 h-5 mr-3" />
        <span>Logout</span>
      </button>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="ml-64 flex-grow p-6">
        {children}
      </div>

      {/* Logout Dialog */}
      {logoutDialogOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h1 className="text-lg font-bold text-red-700 mb-4">Confirm Logout</h1>
      <p className="text-sm text-gray-700 mb-6">Are you sure you want to log out?</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
          Logout
        </button>
        <button
          type="button"
          onClick={closeLogoutDialog}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default VenueSidebar;