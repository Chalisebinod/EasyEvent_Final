import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VenueSidebar from "./VenueSidebar";
import axios from "axios";
import { FaTimes, FaCommentAlt, FaSearch, FaSort, FaUser, FaCalendar } from "react-icons/fa";

// Helper function to construct the correct image URL
function getProfileImageUrl(profileImage) {
  if (!profileImage) {
    return "https://via.placeholder.com/40"; // fallback if no image
  }
  // Replace backslashes with forward slashes to ensure a valid URL
  const normalizedPath = profileImage.replace(/\\/g, "/");
  return `http://localhost:8000/${normalizedPath}`;
}

function Request() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed

  const venueId = localStorage.getItem("venueId");
  const accessToken = localStorage.getItem("access_token");

  // Messaging feature state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const handleSendMessage = () => {
    if (chatInput.trim() === "") return;
    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: chatInput,
      time: new Date().toLocaleTimeString(),
    };
    setChatMessages((prevMessages) => [...prevMessages, newMessage]);
    setChatInput("");
  };

  // Fetch venue requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/booking/requests/venue/${venueId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setRequests(response.data.requests);
        console.log("Requests fetched:", response.data.requests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    if (venueId && accessToken) {
      fetchRequests();
    }
  }, [venueId, accessToken]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on search change
  };

  const handleSortChange = (e) => setSort(e.target.value);

  const handleViewRequest = (id) => {
    navigate(`/event-details/${id}`);
  };

  // Filter and sort requests
  const filteredRequests = requests.filter(
    (req) =>
      (req.user?.name &&
        req.user.name.toLowerCase().includes(search.toLowerCase())) ||
      req.event_details.event_type.toLowerCase().includes(search.toLowerCase())
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sort === "date") {
      return new Date(a.event_details.date) - new Date(b.event_details.date);
    } else {
      return a.event_details.event_type.localeCompare(
        b.event_details.event_type
      );
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const paginatedRequests = sortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Approve":
        return "bg-green-500";
      case "Reject":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <VenueSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Event Requests</h1>
            <p className="text-gray-600 mt-2">Manage all incoming event booking requests</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by name or event type"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <FaSort className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={sort}
                  onChange={handleSortChange}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="event">Sort by Event</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests Cards */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {paginatedRequests.map((req) => (
              <div 
                key={req._id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300"
              >
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                      src={getProfileImageUrl(req.user?.profile_image)}
                      alt={req.user?.name || "Unknown User"}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{req.user?.name || "Unknown"}</h3>
                      <p className="text-sm text-gray-500">{req.event_details.event_type}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FaCalendar className="mr-2" />
                      {new Date(req.event_details.date).toLocaleDateString()}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(req.status)}`}
                    >
                      {req.status}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleViewRequest(req._id)}
                    className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Requests Table for larger screens */}
          <div className="hidden lg:block overflow-hidden bg-white rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-blue-50 transition-colors duration-150">
                    {/* Profile Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          src={getProfileImageUrl(req.user?.profile_image)}
                          alt={req.user?.name || "Unknown User"}
                        />
                        <span className="text-gray-800 font-medium">
                          {req.user?.name || "Unknown"}
                        </span>
                      </div>
                    </td>

                    {/* Event Type Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {req.event_details.event_type}
                    </td>

                    {/* Event Date Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {new Date(req.event_details.date).toLocaleDateString()}
                    </td>

                    {/* Status Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(req.status)}`}
                      >
                        {req.status}
                      </span>
                    </td>

                    {/* Action Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewRequest(req._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {paginatedRequests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <FaUser className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No requests found</h3>
              <p className="mt-2 text-sm text-gray-500">
                There are no event requests matching your search criteria.
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{" "}
                {filteredRequests.length} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  // Simple pagination logic to show current page and neighbors
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-blue-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Request;