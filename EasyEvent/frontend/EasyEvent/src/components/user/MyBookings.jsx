import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import BottomNavbar from "./BottomNavbar";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 3;

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "http://localhost:8000/api/booking/myBooking",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }
        const data = await response.json();
        setBookings(data.bookings);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalPages = Math.ceil(bookings.length / rowsPerPage);
  const displayedBookings = bookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading bookings...</div>
        </main>
        <BottomNavbar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-1 container mx-auto px-2 py-8 flex items-center justify-center">
          <div className="text-xl text-red-600">Error: {error}</div>
        </main>
        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-2 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg text-gray-600">You have no bookings yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-4 text-left">Event Type</th>
                    <th className="py-3 px-4 text-left">Venue</th>
                    <th className="py-3 px-4 text-left">Hall</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Guests</th>
                    <th className="py-3 px-4 text-left">Total Cost</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Payment</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm">
                  {displayedBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-gray-200 hover:bg-gray-100"
                    >
                      <td className="py-3 px-4">
                        {booking.event_details.event_type}
                      </td>
                      <td className="py-3 px-4">
                        {booking.venue?.name || "Na"}
                      </td>
                      <td className="py-3 px-4">
                        {booking.hall?.name || "Na"}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(booking.event_details.date)}
                      </td>
                      <td className="py-3 px-4">
                        {booking.event_details.guest_count}
                      </td>
                      <td className="py-3 px-4">
                        ${booking.pricing.total_cost}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-white ${
                            booking.status === "Completed"
                              ? "bg-green-500"
                              : booking.status === "Pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-white ${
                            booking.payment_status === "Paid"
                              ? "bg-green-500"
                              : booking.payment_status === "Partially Paid"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                        >
                          {booking.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bookings.length > rowsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNavbar />
    </div>
  );
};

export default MyBookings;
