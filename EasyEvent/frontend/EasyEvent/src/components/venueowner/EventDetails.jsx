  
  import React, { useEffect, useState } from "react";
  import { useParams, useNavigate, useLocation } from "react-router-dom";
  import axios from "axios";
  import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    IconButton,
    Typography,
    Paper,
    Chip,
    Divider,
    Tooltip,
  } from "@mui/material";
  import {
    FaEnvelope,
    FaUtensils,
    FaCalendarAlt,
    FaUserTie,
    FaMapMarkerAlt,
    FaBuilding,
    FaRegMoneyBillAlt,
    FaClock,
    FaUserCheck,
    FaRegCreditCard,
    FaBan,
    FaCheck,
  } from "react-icons/fa";
  import VenueSidebar from "./VenueSidebar";
  import { toast, ToastContainer } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";
  
  function EventDetails() {
    const { id: bookingId } = useParams();
    const location = useLocation();
    const isRequest = location.state?.isRequest ?? true;
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [reason, setReason] = useState("");
    // Replace the single loading state with two separate ones:
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
  
    const accessToken = localStorage.getItem("access_token");
    const navigate = useNavigate();
  
    // Use optional chaining to safely generate a profile image URL.
    function getProfileImageUrl(profileImage) {
      if (!profileImage) {
        return "https://via.placeholder.com/40"; // fallback if no image
      }
      const normalizedPath = profileImage.replace(/\\/g, "/");
      return `http://localhost:8000/${normalizedPath}`;
    }
  
    useEffect(() => {
      const fetchBookingDetails = async () => {
        try {
          setLoading(true);
          let response;
          if (isRequest) {
            response = await axios.get(
              `http://localhost:8000/api/booking/requests/profile/${bookingId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          } else {
            response = await axios.get(
              `http://localhost:8000/api/booking/approved/details/${bookingId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          }
  
          if (response.data.booking) {
            setBooking(response.data.booking);
            console.log("user", response.data.booking);
          } else {
            console.error("No booking details found");
            setError("Booking details not found");
          }
        } catch (error) {
          console.error("Error fetching booking details:", error);
          setError(error.response?.data?.message || error.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchBookingDetails();
    }, [bookingId, accessToken, isRequest]);
  
    // Show an alert message if booking status is not Pending.
    useEffect(() => {
      if (booking && booking.status !== "Pending") {
        setShowAlert(true);
        setAlertMessage(`Booking status updated to "${booking.status}"!`);
        const timer = setTimeout(() => {
          setShowAlert(false);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }, [booking]);
  
    // New function to handle approve action
    const handleApprove = async () => {
      try {
        setIsApproving(true);
        const payload = { status: "Accepted", reason: "Request approved by venue owner" };
        const response = await axios.patch(
          `http://localhost:8000/api/booking/requests/${bookingId}`,
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
  
        if (response.data.booking) {
          setBooking(response.data.booking);
          toast.success("Booking accepted successfully!");
          // Redirect after a short delay (adjust route if needed)
          setTimeout(() => {
            navigate("/user-request");
          }, 2000);
        }
      } catch (error) {
        console.error("Error updating booking status:", error);
        toast.error("Failed to update booking status");
      } finally {
        setIsApproving(false);
      }
    };
  
    // New function to handle reject action
    const handleReject = async () => {
      try {
        setIsRejecting(true);
        const payload = { status: "Rejected", reason };
        const response = await axios.patch(
          `http://localhost:8000/api/booking/requests/${bookingId}`,
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
  
        if (response.data.booking) {
          setBooking(response.data.booking);
          toast.success("Booking rejected successfully!");
          // Redirect after a short delay (adjust route if needed)
          setTimeout(() => {
            navigate("/user-request");
          }, 2000);
        }
      } catch (error) {
        console.error("Error updating booking status:", error);
        toast.error("Failed to update booking status");
      } finally {
        setIsRejecting(false);
        setShowModal(false);
      }
    };
  
    const handleActionClick = (type) => {
      setModalType(type);
      if (type === "reject") {
        setReason("");
        setShowModal(true);
      } else if (type === "approve") {
        handleApprove();
      }
    };
  
    // Function to get status color
    const getStatusColor = (status) => {
      switch(status) {
        case "Pending": return "text-amber-500 bg-amber-50";
        case "Accepted": return "text-green-500 bg-green-50";
        case "Rejected": return "text-red-500 bg-red-50";
        default: return "text-gray-500 bg-gray-50";
      }
    };
  
    if (loading) {
      return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-purple-50">
          <VenueSidebar />
          <div className="flex-1 p-10 flex flex-col items-center justify-center w-full">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-4 border-indigo-600"></div>
            <p className="mt-6 text-xl text-indigo-700 font-medium">Loading booking details...</p>
          </div>
        </div>
      );
    }
  
    if (error || !booking) {
      return (
        <div className="min-h-screen flex bg-gradient-to-br from-red-50 to-orange-50">
          <VenueSidebar />
          <div className="flex-1 p-10 flex flex-col items-center justify-center w-full">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
              <div className="text-center text-red-600 text-xl font-medium">
                <FaBan className="text-4xl mx-auto mb-4" />
                {error || "Booking not found"}
              </div>
              <button 
                onClick={() => navigate(-1)}
                className="mt-6 px-5 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition w-full"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-50">
        <VenueSidebar />
        <div className="flex-1 relative w-full">
          <ToastContainer position="top-right" />
          {/* Sticky Header */}
          <header className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200 px-6 py-5">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <div>
              <h1 className="text-2xl font-bold text-black">
              {isRequest ? "Booking Request Details" : "Booking Details"}
                </h1>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                 
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
              </button>
            </div>
          </header>
  
          {/* Toast Alert */}
          {showAlert && (
            <div className="fixed top-6 right-6 z-50">
              <div className="flex items-start p-4 space-x-3 bg-green-50 rounded-lg shadow-lg border-l-4 border-green-500 transition-all animate-fade-in">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-800 font-semibold">{alertMessage}</p>
                  <p className="text-green-700 text-sm">
                    An email has been sent to{" "}
                    <span className="font-semibold">
                      {booking.user?.email || "the user"}
                    </span>
                    . Thank you for using EasyEvent!
                  </p>
                  <button 
                    onClick={() => setShowAlert(false)}
                    className="text-xs text-green-600 hover:text-green-800 mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
  
          {/* Main Content */}
          <main className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="w-full bg-white p-8 rounded-3xl shadow-xl border border-indigo-100 transition duration-500 hover:shadow-2xl">
              {/* User Info with Card Design */}
              <div className="relative mb-12 border-b pb-8">
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-full shadow-lg">
                  <img
                    src={getProfileImageUrl(booking.user?.profile_image)}
                    alt="User Profile"
                    className="w-28 h-28 rounded-full border-4 border-white"
                  />
                </div>
                <div className="text-center pt-16">
                  {booking.user ? (
                    <>
                      <h3 className="text-3xl font-bold text-gray-800">
                        {booking.user.name}
                      </h3>
                      <p className="text-gray-500 text-base flex items-center justify-center gap-2 mt-2">
                        <FaEnvelope className="text-indigo-500" />
                        {booking.user.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">User information not available.</p>
                  )}
                </div>
              </div>
  
              <Grid container spacing={4}>
                {/* Event Information */}
                <Grid item xs={12} md={6}>
                  <Paper className="p-8 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 h-full transition hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-indigo-100 p-3 rounded-full">
                        <FaUserTie className="text-indigo-600 text-xl" />
                      </div>
                      <Typography variant="h5" className="font-bold text-gray-800">
                        Event Information
                      </Typography>
                    </div>
                    <Divider className="mb-6" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-2 rounded-full">
                          <FaUserTie className="text-green-600" />
                        </div>
                        <div>
                          <Typography className="text-gray-500 text-sm">Event Type</Typography>
                          <Typography className="text-gray-800 font-medium">
                            {booking.event_details?.event_type || "Not specified"}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <FaCalendarAlt className="text-indigo-600" />
                        </div>
                        <div>
                          <Typography className="text-gray-500 text-sm">Event Date</Typography>
                          <Typography className="text-gray-800 font-medium">
                            {booking.event_details?.date
                              ? new Date(booking.event_details.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : "Not specified"}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-2 rounded-full">
                          <FaUtensils className="text-red-600" />
                        </div>
                        <div>
                          <Typography className="text-gray-500 text-sm">Number of Guests</Typography>
                          <Typography className="text-gray-800 font-medium">
                            {booking.event_details?.guest_count ?? "Not specified"}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Paper>
                </Grid>
  
                {/* Venue & Hall Details */}
                <Grid item xs={12} md={6}>
                  <Paper className="p-8 rounded-2xl shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100 h-full transition hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-pink-100 p-3 rounded-full">
                        <FaBuilding className="text-pink-600 text-xl" />
                      </div>
                      <Typography variant="h5" className="font-bold text-gray-800">
                        Venue & Hall
                      </Typography>
                    </div>
                    <Divider className="mb-6" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-pink-100 p-2 rounded-full">
                          <FaMapMarkerAlt className="text-pink-600" />
                        </div>
                        <div>
                          <Typography className="text-gray-500 text-sm">Venue Location</Typography>
                          <Typography className="text-gray-800 font-medium">
                            {booking.venue?.name
                              ? `${booking.venue.name}`
                              : "No venue information"} 
                          </Typography>
                          {booking.venue?.location && (
                            <Typography className="text-gray-600 text-sm">
                              {`${booking.venue.location?.address || ""}, ${booking.venue.location?.city || ""}`}
                            </Typography>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <FaBuilding className="text-purple-600" />
                        </div>
                        <div>
                          <Typography className="text-gray-500 text-sm">Selected Hall</Typography>
                          <Typography className="text-gray-800 font-medium">
                            {booking.hall?.name || "No hall selected"}
                            {booking.hall?.capacity && (
                              <span className="text-gray-600 text-sm ml-2">
                                (Capacity: {booking.hall.capacity})
                              </span>
                            )}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Paper>
                </Grid>
  
                {/* Pricing Details */}
                <Grid item xs={12} md={6}>
                  <Paper className="p-8 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-teal-100 h-full transition hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-emerald-100 p-3 rounded-full">
                        <FaRegMoneyBillAlt className="text-emerald-600 text-xl" />
                      </div>
                      <Typography variant="h5" className="font-bold text-gray-800">
                        Pricing Details
                      </Typography>
                    </div>
                    <Divider className="mb-6" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Typography className="text-gray-600">Original per plate:</Typography>
                        <Typography className="text-gray-800 font-semibold">
                          Rs.{booking.pricing?.original_per_plate_price ?? "N/A"}
                        </Typography>
                      </div>
                      <div className="flex items-center justify-between">
                        <Typography className="text-gray-600">User offered per plate:</Typography>
                        <Typography className="text-gray-800 font-semibold">
                          Rs.{booking.pricing?.user_offered_per_plate_price ?? "N/A"}
                        </Typography>
                      </div>
                      <div className="flex items-center justify-between">
                        <Typography className="text-gray-600">Final per plate:</Typography>
                        <Typography className="text-gray-800 font-semibold">
                          Rs.{booking.pricing?.final_per_plate_price ?? "N/A"}
                        </Typography>
                      </div>
                      <Divider />
                      <div className="flex items-center justify-between pt-2">
                        <Typography className="text-gray-800 font-bold">Total cost:</Typography>
                        <Typography className="text-emerald-600 font-bold text-xl">
                          Rs.{booking.pricing?.total_cost ?? "N/A"}
                        </Typography>
                      </div>
                    </div>
                  </Paper>
                </Grid>
  
                {/* Selected Foods */}
                <Grid item xs={12} md={6}>
                  <Paper className="p-8 rounded-2xl shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 h-full transition hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-amber-100 p-3 rounded-full">
                        <FaUtensils className="text-amber-600 text-xl" />
                      </div>
                      <Typography variant="h5" className="font-bold text-gray-800">
                        Selected Foods
                      </Typography>
                    </div>
                    <Divider className="mb-6" />
                    {Array.isArray(booking.selected_foods) && booking.selected_foods.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {booking.selected_foods.map((food) => (
                          <Chip
                            key={food?._id}
                            label={`${food.name} - Rs.${food.price}`}
                            color="primary"
                            variant="outlined"
                            className="bg-white shadow-sm border-amber-300 text-amber-700"
                            sx={{ borderColor: '#d97706', color: '#b45309' }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-amber-50 rounded-lg border border-amber-100">
                        <Typography className="text-amber-700">No food items selected.</Typography>
                      </div>
                    )}
                  </Paper>
                </Grid>
  
                {/* Additional Services */}
                <Grid item xs={12} md={6}>
                  <Paper className="p-8 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-cyan-100 h-full transition hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-cyan-100 p-3 rounded-full">
                        <FaUserCheck className="text-cyan-600 text-xl" />
                      </div>
                      <Typography variant="h5" className="font-bold text-gray-800">
                        Additional Services
                      </Typography>
                    </div>
                    <Divider className="mb-6" />
                    {Array.isArray(booking.additional_services) &&
                    booking.additional_services.length > 0 ? (
                      <ul className="space-y-3">
                        {booking.additional_services.map((service) => (
                          <li key={service?._id} className="bg-white p-3 rounded-lg shadow-sm border border-cyan-100">
                            <span className="font-medium text-cyan-700">{service.name}:</span>{" "}
                            <span className="text-gray-600">{service.description}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-cyan-50 rounded-lg border border-cyan-100">
                        <Typography className="text-cyan-700">
                          No additional services selected.
                        </Typography>
                      </div>
                    )}
                  </Paper>
                </Grid>
  
                {/* Cancellation Policy */}
                <Grid item xs={12} md={6}>
                  <Paper className="p-8 rounded-2xl shadow-lg bg-gradient-to-br from-red-50 to-rose-50 border border-rose-100 h-full transition hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-rose-100 p-3 rounded-full">
                        <FaBan className="text-rose-600 text-xl" />
                      </div>
                      <Typography variant="h5" className="font-bold text-gray-800">
                        Cancellation Policy
                      </Typography>
                    </div>
                    <Divider className="mb-6" />
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-rose-100">
                      <Typography className="text-gray-600">
                        <span className="font-semibold">Cancellation Fee:</span>{" "}
                        <span className="text-rose-600 font-semibold">
                          Rs.{booking.cancellation_policy?.cancellation_fee ?? "N/A"}
                        </span>
                      </Typography>
                    </div>
                  </Paper>
                </Grid>
              </Grid>
  
              {/* Payment & Booking Status */}
              {isRequest &&
                (booking.status === "Pending" ||
                  booking.status === "Accepted") && (
                  <div className="mt-12 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                      <div className="space-y-3 mb-6 md:mb-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <FaRegCreditCard className="text-blue-600" />
                          </div>
                          <Typography className="text-gray-800">
                            <span className="font-medium">Payment Status:</span>{" "}
                            <span className={`font-semibold ${booking.payment_status === "Paid" ? "text-green-600" : "text-amber-600"}`}>
                              {booking.payment_status ?? "N/A"}
                            </span>
                          </Typography>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <FaClock className="text-purple-600" />
                          </div>
                          <Typography className="text-gray-800">
                            <span className="font-medium">Booking Status:</span>{" "}
                            <span className={`font-semibold ${
                              booking.status === "Accepted" ? "text-green-600" : 
                              booking.status === "Rejected" ? "text-red-600" : "text-amber-600"
                            }`}>
                              {booking.status ?? "N/A"}
                            </span>
                          </Typography>
                        </div>
                      </div>
  
                      <div className="flex gap-6">
                        {booking.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleActionClick("approve")}
                              disabled={isApproving || isRejecting}
                              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                              {isApproving ? (
                                <>
                                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FaCheck /> Approve Request
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleActionClick("reject")}
                              disabled={isApproving || isRejecting}
                              className="px-8 py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                              {isRejecting ? (
                                <>
                                  <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FaBan /> Decline Request
                                </>
                              )}
                            </button>
                          </>
                        )}
                        {booking.status === "Accepted" && (
                          <button
                            onClick={() => handleActionClick("reject")}
                            disabled={isApproving || isRejecting}
                            className="px-8 py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition shadow-md disabled:opacity-50 flex items-center gap-2"
                          >
                            {isRejecting ? (
                              <>
                                <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <FaBan /> Reject Offer
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </main>

        {/* Rejection Modal */}
        {showModal && modalType === "reject" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-2xl p-8 w-full sm:w-11/12 md:w-1/3 shadow-xl">
              <h3 className="text-2xl font-bold mb-6">Confirm Rejection</h3>
              <div className="mb-6">
                <label className="block text-gray-700 mb-3 font-medium">
                  Reason for Rejection:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                  rows="3"
                  placeholder="Enter reason here..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-6">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isRejecting || isApproving}
                  className="px-5 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !reason.trim()}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isRejecting ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetails;

