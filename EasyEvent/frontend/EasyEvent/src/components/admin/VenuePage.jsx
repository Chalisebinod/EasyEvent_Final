import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./DashboardLayout";
import { toast, ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

const API_URL = "http://localhost:8000/api/admin/venues";
const API_URL_Block = "http://localhost:8000/api/venue";

const ITEMS_PER_PAGE = 10;

const VenuePage = () => {
  const [venues, setVenues] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date");

  // Fetch venues from API
  const fetchVenues = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");

    try {
      const { data: responseData } = await axios.get(API_URL, {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          sort: sortOption,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { data: venuesData, pagination } = responseData;
      setVenues(venuesData);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [page, searchTerm, sortOption]);

  // Handle block/unblock action
  const handleBlockVenue = async (venueId, isBlocked) => {
    let reason = null;

    if (isBlocked) {
      const confirmUnblock = prompt("Type 'YES' to confirm unblocking this venue:");
      if (confirmUnblock !== "YES") {
        toast.error("Unblocking failed. You must type 'YES' in all capital letters.");
        return;
      }
    } else {
      reason = prompt("Please provide a reason for blocking this venue:");
      if (!reason) {
        toast.error("Blocking reason is required.");
        return;
      }
    }

    const token = localStorage.getItem("access_token");

    try {
      await axios.put(
        `${API_URL_Block}/block/${venueId}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the venues state dynamically
      setVenues((prevVenues) =>
        prevVenues.map((venue) =>
          venue._id === venueId
            ? { ...venue, is_blocked: !isBlocked, block_reason: reason }
            : venue
        )
      );

      // Display toast message
      toast.success(
        isBlocked
          ? "Venue unblocked successfully."
          : "Venue blocked successfully."
      );
    } catch (error) {
      console.error("Error toggling venue status:", error);
      toast.error("Error updating venue status.");
    }
  };

  // Filter handlers
  const handlePageChange = (newPage) => setPage(newPage);
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex">
      <DashboardLayout />
      <div className="flex-grow p-8 bg-white min-h-screen">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Venue Management</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name ..."
            className="flex-1 min-w-[220px] px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-xl text-gray-600">Loading...</p>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">Contact</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-white uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {venues.map((venue) => (
                    <tr key={venue._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                        {venue.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venue.location
                          ? `${venue.location.address}, ${venue.location.city || ""}`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venue.contact_details?.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venue.is_blocked ? "Blocked" : "Active"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleBlockVenue(venue._id, venue.is_blocked)}
                          className={`px-4 py-2 rounded-md text-white font-medium shadow-sm transition-colors duration-200 ${
                            venue.is_blocked
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {venue.is_blocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  disabled={page === index + 1}
                  className={`px-4 py-2 mx-1 border rounded-lg font-semibold transition-colors duration-200 ${
                    page === index + 1
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <ToastContainer /> 
    </div>
  );
};

export default VenuePage;