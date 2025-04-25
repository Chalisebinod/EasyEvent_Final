import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "./DashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [blockStatus, setBlockStatus] = useState("all");
  const [sort, setSort] = useState("date");

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, blockStatus, sort]);

  const fetchUsers = async (currentPage) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.get(
        `http://localhost:8000/api/users?page=${currentPage}&limit=10&search=${search}&blockStatus=${blockStatus}&sort=${sort}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { data, pagination } = response.data;
      setUsers(data);
      setPages(pagination.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId, isBlocked) => {
    let reason = null;

    if (isBlocked) {
      const confirmUnblock = prompt("Type 'YES' to confirm unblocking this user:");
      if (confirmUnblock !== "YES") {
        toast.error("Unblocking failed. You must type 'YES' in all capital letters.");
        return;
      }
    } else {
      reason = prompt("Please provide a reason for blocking this user:");
      if (!reason) {
        toast.error("Blocking reason is required.");
        return;
      }
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/users/block/${userId}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      // Update the user list dynamically
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, is_blocked: !isBlocked, block_reason: reason }
            : user
        )
      );

      // Display toast message
      toast.success(
        isBlocked
          ? "User unblocked successfully."
          : "User blocked successfully."
      );
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      toast.error("Failed to update user status.");
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleBlockStatusChange = (event) => {
    setBlockStatus(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  return (
    <div className="flex">
      <DashboardLayout />
      <div className="flex-grow p-8 bg-white min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">User Management</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or email"
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
            value={sort}
            onChange={handleSortChange}
            className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-xl text-gray-700">Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
              <table className="min-w-full">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-b border-blue-700">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-b border-blue-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-b border-blue-700">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-b border-blue-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user._id}
                      className={`${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100`}
                    >
                      <td className="px-6 py-4 text-base font-medium text-gray-800 border-b border-gray-200">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-base font-medium text-gray-800 border-b border-gray-200">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-base font-medium text-gray-800 border-b border-gray-200">
                        {user.contact_number || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-base border-b border-gray-200">
                        <button
                          onClick={() => blockUser(user._id, user.is_blocked)}
                          className={`px-4 py-2 rounded-md text-white font-semibold shadow-sm transition-colors duration-200 ${
                            user.is_blocked
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {user.is_blocked ? "Unblock" : "Block"}
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
                  className={`px-4 py-2 mx-1 border rounded-md font-semibold transition-colors duration-200 ${
                    page === index + 1
                      ? "bg-blue-500 text-white border-blue-500"
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

export default UserPage;