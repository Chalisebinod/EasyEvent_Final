import React, { useEffect, useState } from "react";
import axios from "axios";
import VenueSidebar from "./VenueSidebar";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          "http://localhost:8000/api/notification/getVenueOwnerNotification",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNotifications(response.data.notifications);
      } catch (err) {
        setError("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `http://localhost:8000/api/notification/markRead/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("access_token");
      // Loop through all notifications that are not read and mark them as read on the backend
      const unreadNotifications = notifications.filter((notification) => !notification.read);
      await Promise.all(
        unreadNotifications.map((notification) =>
          axios.put(
            `http://localhost:8000/api/notification/markRead/${notification._id}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );
      // Then update local state so that all notifications are marked as read
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  // Clear all notifications
  const clearNotifications = async () => {
    try {
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  // Compute unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Section */}
      <VenueSidebar />

      {/* Main Content Section */}
      <div className="flex-1 p-8 bg-gray-100">
        <div className="w-full mx-auto bg-white p-8 rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <svg
                className="h-8 w-8 text-blue-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Notifications
            </h2>
            <div className="flex space-x-4 mt-4 sm:mt-0 items-center">
              {/* Notification count badge */}
              {unreadCount > 0 && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {unreadCount} New
                </span>
              )}
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Mark All as Read
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {loading && <p className="text-gray-600">Loading notifications...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && notifications.length === 0 && (
            <p className="text-gray-600 text-center py-10">No notifications found.</p>
          )}

          <ul className="space-y-6">
            {notifications.map((notification) => (
              <li
                key={notification._id}
                onClick={() => markAsRead(notification._id)}
                className={`p-6 border rounded-xl cursor-pointer transition transform duration-300 hover:scale-105 ${
                  notification.read
                    ? "bg-gray-200 border-gray-300"
                    : "bg-white border-gray-200 hover:shadow-2xl"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-lg text-gray-800">{notification.message}</p>
                  {!notification.read && (
                    <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-gray-500 mt-2 text-sm">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Notification;
