import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import VenueBookModel from "./modal/VenueBookModel";
import VenueSidebar from "./VenueSidebar";
import { toast } from "react-toastify";

const OwnerBooking = () => {
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const accessToken = localStorage.getItem("access_token");
  const venueId = localStorage.getItem("venueId");
  const navigate = useNavigate();

  // PATCH request to update booking status
  const handleStatusUpdate = async (bookingId, requestId, isCompleted) => {
    try {
      setIsUpdating(true);
      const response = await axios.patch(
        "http://localhost:8000/api/updateStatus",
        { bookingId, requestId, isCompleted },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success(`Event marked as ${isCompleted ? "completed" : "running"}`);
        if (isCompleted) {
          toast.info("A review request email has been sent to the customer", {
            autoClose: 8000
          });
        }
        fetchApprovedBookings(); // Refresh the bookings list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
      setOpenDialog(false);
      setSelectedBooking(null);
      setConfirmationText("");
    }
  };

  // Show the confirmation dialog when switch is clicked
  const handleToggleClick = (booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  // Close dialog
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
    setConfirmationText("");
  };

  // Confirm and call the updater
  const handleConfirmStatus = () => {
    if (selectedBooking) {
      handleStatusUpdate(
        selectedBooking._id,
        selectedBooking.requestId,
        !selectedBooking.booking_statius
      );
    }
  };

  // Fetch approved bookings
  const fetchApprovedBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/booking/approved/${venueId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setApprovedBookings(response.data.bookings || []);
      if (response.data.bookings && response.data.bookings[0]) {
        setRequestId(response.data.bookings[0].requestId);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) {
      fetchApprovedBookings();
    }
    // eslint-disable-next-line
  }, [venueId]);

  const handleOpenCreate = () => {
    setOpenCreateModal(true);
  };

  const handleCloseCreate = () => {
    setOpenCreateModal(false);
    if (venueId) {
      fetchApprovedBookings();
    }
  };

  const handleBookingClick = (booking) => {
    navigate(`/venue-owner/approved-booking/${booking._id}`);
  };

  // Mapping for status badge Tailwind classes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Accepted":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "Running":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Completed":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render a single booking card with updated, bold styling
  const renderBookingCard = (booking) => (
    <div
      key={booking._id}
      className="bg-white rounded-lg shadow-lg overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl cursor-pointer border border-gray-100"
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
        <div className="flex justify-between items-center">
          <h6 className="text-2xl font-bold text-gray-800">
            {booking.event_details.event_type}
          </h6>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusBadgeClass(booking.status)}`}>
            {booking.status}
          </span>
        </div>
      </div>
      
      <div className="px-6 py-4" onClick={() => handleBookingClick(booking)}>
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="text-gray-700">
            <span className="font-medium">Date:</span>{" "}
            <span className="font-semibold">{formatDate(booking.event_details.date)}</span>
          </p>
        </div>
        
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p className="text-gray-700">
            <span className="font-medium">Guests:</span>{" "}
            <span className="font-semibold">{booking.event_details.guest_count}</span>
          </p>
        </div>
        
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <p className="text-gray-700">
            <span className="font-medium">Hall:</span>{" "}
            <span className="font-semibold">{booking.hall?.name}</span>{" "}
            <span className="text-sm text-gray-500">
              (Capacity: {booking.hall?.capacity})
            </span>
          </p>
        </div>
        
        {booking.pricing?.total_cost && (
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-gray-700">
              <span className="font-medium">Total Cost:</span>{" "}
              <span className="font-semibold text-indigo-700">₹{booking.pricing.total_cost.toLocaleString()}</span>
            </p>
          </div>
        )}

        <div className="mt-4">
          <p className="text-gray-800 font-bold mb-2 flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            Selected Menu
          </p>
          <div className="flex flex-wrap gap-2 ml-7">
            {booking.selected_foods && booking.selected_foods.length > 0 ? (
              booking.selected_foods.map((food) => (
                <span
                  key={food._id}
                  className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full"
                >
                  {food.name}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No food selected</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className={`w-5 h-5 mr-2 ${booking.booking_statius ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium text-gray-700">
              {booking.booking_statius ? "Event Completed" : "Event in Progress"}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className={`text-sm font-medium mr-3 ${booking.booking_statius ? "text-green-600" : "text-blue-600"}`}>
              {booking.booking_statius 
                ? "Customer feedback requested" 
                : "Mark as completed to request feedback"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={booking.booking_statius || false}
                onChange={() => handleToggleClick(booking)}
                disabled={isUpdating}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VenueSidebar />
      <div className="flex-grow p-6">
        <div className="container mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Approved Bookings</h1>
                {/* <p className="text-gray-600 mt-1">
                  Manage your venue's confirmed events and mark them as completed once they're done
                </p> */}
              </div>
              {/* <div className="flex space-x-3">
                <button 
                  onClick={() => fetchApprovedBookings()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Booking
                </button>
              </div> */}
            </div>
          </div>

          {loading && (
            <div className="w-full bg-indigo-100 rounded-full h-2 mb-8">
              <div className="bg-indigo-600 h-2 rounded-full w-3/4 animate-pulse"></div>
            </div>
          )}
          
          {error && (
            <div className="p-4 mb-8 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          )}
          
          {!loading && approvedBookings.length === 0 && (
            <div className="bg-white p-8 mb-8 text-center rounded-lg border border-gray-200 shadow-sm">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Approved Bookings</h3>
              <p className="text-gray-600">
                You don't have any approved bookings at the moment. New bookings will appear here once they are confirmed.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create a New Booking
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {approvedBookings.map((booking) => renderBookingCard(booking))}
          </div>
        </div>
      </div>

      {/* Customized Modal Dialog for confirmation */}
      {openDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleDialogClose}>
              <div className="absolute inset-0 bg-black opacity-50"></div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full z-50">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Confirm Event Completion
                  </h3>
                  <button onClick={handleDialogClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  <div className="flex">
                    <svg className="w-6 h-6 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <p className="font-semibold mb-1">Important Information</p>
                      <p className="text-sm">
                        When you mark an event as completed, an email will automatically be sent to the customer with a link to provide ratings and reviews for your venue.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to mark this event as completed? This action cannot be undone.
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Please type <span className="font-bold">YES</span> to confirm:
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type YES to confirm"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end border-t border-gray-100">
                <button
                  onClick={handleDialogClose}
                  className="mr-3 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatus}
                  disabled={confirmationText !== "YES" || isUpdating}
                  className={`px-4 py-2 rounded-lg text-white font-medium flex items-center transition ${
                    confirmationText === "YES" && !isUpdating
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-indigo-400 cursor-not-allowed"
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Confirm Completion
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating a Booking */}
      <VenueBookModel open={openCreateModal} onClose={handleCloseCreate} />
    </div>
  );
};

export default OwnerBooking;