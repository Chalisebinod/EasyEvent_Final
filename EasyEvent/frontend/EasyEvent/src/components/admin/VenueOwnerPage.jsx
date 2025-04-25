import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VenueOwnerPage = () => {
  const [venueOwners, setVenueOwners] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [blockStatus, setBlockStatus] = useState("all");

  useEffect(() => {
    fetchVenueOwners(page, searchTerm, sortBy, blockStatus);
  }, [page, searchTerm, sortBy, blockStatus]);

  const fetchVenueOwners = async (
    currentPage,
    search = "",
    sort = "date",
    block = "all"
  ) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/venue-owners?page=${currentPage}&limit=10&search=${search}&sort=${sort}&blockStatus=${block}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { data, pagination } = response.data;
      setVenueOwners(data);
      setPages(pagination.totalPages);
    } catch (error) {
      console.error("Error fetching venue owners:", error);
    } finally {
      setLoading(false);
    }
  };

  const blockVenueOwner = async (venueOwnerId, isBlocked) => {
    let reason = null;

    if (isBlocked) {
      const confirmUnblock = prompt("Type 'YES' to confirm unblocking this venue owner:");
      if (confirmUnblock !== "YES") {
        toast.error("Unblocking failed. You must type 'YES' in all capital letters.");
        return;
      }
    } else {
      reason = prompt("Please provide a reason for blocking this venue owner:");
      if (!reason) {
        toast.error("Blocking reason is required.");
        return;
      }
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/venueOwner/block/${venueOwnerId}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      // Update the venue owner list dynamically
      setVenueOwners((prevOwners) =>
        prevOwners.map((owner) =>
          owner._id === venueOwnerId
            ? { ...owner, is_blocked: !isBlocked, block_reason: reason }
            : owner
        )
      );

      // Display toast message
      toast.success(
        isBlocked
          ? "Venue owner unblocked successfully."
          : "Venue owner blocked successfully."
      );
    } catch (error) {
      console.error("Error blocking/unblocking venue owner:", error);
      toast.error("Failed to update venue owner status.");
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleBlockStatusChange = (e) => {
    setBlockStatus(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex">
      <DashboardLayout />
      <div className="flex-grow p-8 bg-white min-h-screen">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">
          Venue Owner Management
        </h1>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-1 min-w-[220px] px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={blockStatus}
            onChange={handleBlockStatusChange}
            className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="blocked">Blocked</option>
            <option value="unblocked">Unblocked</option>
          </select>
          <select
            value={sortBy}
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
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                      Contact Number
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {venueOwners.map((venueOwner) => (
                    <tr key={venueOwner._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venueOwner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venueOwner.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venueOwner.contact_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {venueOwner.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            blockVenueOwner(venueOwner._id, venueOwner.is_blocked)
                          }
                          className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-colors duration-200 ${
                            venueOwner.is_blocked
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {venueOwner.is_blocked ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8">
              {Array.from({ length: pages }, (_, index) => (
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

export default VenueOwnerPage;