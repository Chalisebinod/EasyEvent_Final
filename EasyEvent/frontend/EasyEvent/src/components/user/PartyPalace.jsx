import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaComments } from "react-icons/fa";
import Navbar from "./Navbar";
import BottomNavbar from "./BottomNavbar";
import ChatWidget from "./chat/ChatWidget";
import { MdVerified } from "react-icons/md";

// StarRating component (unchanged)
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;

  return (
    <div className="flex">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.19c.969 0 1.371 1.24.588 1.81l-3.392 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.392-2.46a1 1 0 00-1.176 0l-3.392 2.46c-.785.57-1.84-.196-1.54-1.118l1.286-3.967a1 1 0 00-.364-1.118L2.035 9.394c-.783-.57-.38-1.81.588-1.81h4.19a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}

      {/* Half star if needed */}
      {halfStar && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfStar)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.19c.969 0 1.371 1.24.588 1.81l-3.392 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.392-2.46a1 1 0 00-1.176 0l-3.392 2.46c-.785.57-1.84-.196-1.54-1.118l1.286-3.967a1 1 0 00-.364-1.118L2.035 9.394c-.783-.57-.38-1.81.588-1.81h4.19a1 1 0 00.95-.69l1.286-3.967z"
          />
        </svg>
      )}

      {/* Empty stars if fullStars < 5 */}
      {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.19c.969 0 1.371 1.24.588 1.81l-3.392 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.392-2.46a1 1 0 00-1.176 0l-3.392 2.46c-.785.57-1.84-.196-1.54-1.118l1.286-3.967a1 1 0 00-.364-1.118L2.035 9.394c-.783-.57-.38-1.81.588-1.81h4.19a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
    </div>
  );
};

// Helper function to build full URL for an image path
const getImageUrl = (imgPath) =>
  `http://localhost:8000/${imgPath.replace(/\\/g, "/")}`;

// ReviewsList component fetches reviews from the API and displays them in a scrollable container
const ReviewsList = ({ venueId }) => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  // Inside ReviewsList component
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("access_token"); // Retrieve token
        const response = await axios.post(
          "http://localhost:8000/api/reviews/getReview",
          { venueId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReviews(response.data);
      } catch (err) {
        console.error("Error fetching reviews:", err.response?.data || err.message);
        setError("Failed to load reviews");
      }
    };

    if (venueId) {
      fetchReviews();
    }
  }, [venueId]);

  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-md shadow-md mt-8">
      {/* Overall Rating */}
      <div className="mb-4">
        <div className="flex items-center">
          <span className="text-2xl font-bold">{averageRating}</span>
          <StarRating rating={parseFloat(averageRating)} />
          <span className="ml-2 text-gray-600">({reviews.length} Ratings)</span>
        </div>
      </div>

      {/* Reviews List in a scrollable container */}
      <div className="max-h-80 overflow-y-auto space-y-6 pr-2">
        {error && <p className="text-red-500">{error}</p>}
        {reviews.length === 0 && !error && (
          <p className="text-gray-600">No reviews available.</p>
        )}
        {reviews.map((review, idx) => (
          <div key={idx} className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Profile image as clickable link */}
                <a
                  href={getImageUrl(review.profileImage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={getImageUrl(review.profileImage)}
                    alt={review.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </a>
                <span className="font-semibold text-gray-800">{review.username}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.reviewDate).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-2">
              <StarRating rating={review.rating} />
            </div>
            <p className="mt-2 text-gray-700">{review.review}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfileIcon = ({ ownerId }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/owner-profile/${ownerId}`);
  };
  return (
    <div
      onClick={handleClick}
      className="absolute top-4 right-4 cursor-pointer text-white"
      title="View Owner Profile"
    >
      <FaUserCircle size={32} />
    </div>
  );
};

const PartyPalace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Track which tab is active: "overview", "completed-events", or "reviews"
  const [activeTab, setActiveTab] = useState("overview");

  const [selectedHall, setSelectedHall] = useState("");
  const [selectedFood, setSelectedFood] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [pricePerPlate, setPricePerPlate] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [userOfferedFee, setUserOfferedFee] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
const accessToken = localStorage.getItem("access_token");
  // New state to hold halls information from the halls API
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/venues/${id}`);
        const data = await response.json();
        setVenue(data.venue);
        if (data.venue.price_per_plate) {
          // This may be overridden by hall selection later
          setPricePerPlate(data.venue.price_per_plate);
        }
      } catch (err) {
        setError("Failed to fetch venue details");
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  // New useEffect to fetch hall details from the halls API
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/halls/${id}`,{ headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },});
        // Expected response: { halls: [ ... ] }
        setHalls(response.data.halls);
        if (response.data.halls.length > 0) {
          // Set default selection to the first hall
          setSelectedHall(response.data.halls[0]._id);
          setPricePerPlate(response.data.halls[0].basePricePerPlate);
        }
      } catch (err) {
        console.error("Error fetching halls:", err.response?.data || err.message);
      }
    };

    fetchHalls();
  }, [id]);

  // Update total fare when guest count or price per plate changes
  useEffect(() => {
    if (guestCount && pricePerPlate) {
      setTotalFare(guestCount * pricePerPlate);
    }
  }, [guestCount, pricePerPlate]);

  const handleGuestCountChange = (e) => {
    const value = e.target.value;
    if (value >= 1) {
      setGuestCount(value);
    }
  };

  // New handler to select a hall from the dropdown
  const handleHallSelect = (e) => {
    const hallId = e.target.value;
    setSelectedHall(hallId);
    const hall = halls.find((h) => h._id === hallId);
    if (hall) {
      setPricePerPlate(hall.basePricePerPlate);
    }
  };

  const openChat = () => {
    setChatOpen(true);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setChatOpen(false);
  };

  // Pass owner _id as partnerId for the booking flow
  const handleBookNow = () => {
    navigate(`/user-book/${id}`, { state: { partnerId: venue.owner?._id } });
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!venue)
    return <div className="text-center p-10">No venue details available.</div>;

  return (
    <div className="bg-gray-50 min-h-screen relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[75vh] w-full">
        <img
          src={
            venue.profile_image
              ? getImageUrl(venue.profile_image)
              : "https://via.placeholder.com/1200x400"
          }
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg flex items-center gap-2">
            {venue.name}
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mt-4">
            A premier venue for unforgettable events
          </p>
        </div>
      </section>


{/* Tabs Section with Book Now Button */}
<section className="max-w-7xl mx-auto my-8 px-4">
  <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
    {/* Tabs Container */}
    <div className="flex divide-x divide-orange-100 border border-orange-100 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setActiveTab("overview")}
        className={`px-8 py-3 text-lg font-semibold transition-colors ${
          activeTab === "overview"
            ? "bg-orange-500 text-white"
            : "text-gray-600 hover:bg-orange-50"
        }`}
      >
        Overview
      </button>
      <button
        onClick={() => setActiveTab("reviews")}
        className={`px-8 py-3 text-lg font-semibold transition-colors ${
          activeTab === "reviews"
            ? "bg-orange-500 text-white"
            : "text-gray-600 hover:bg-orange-50"
        }`}
      >
        Reviews
      </button>
    </div>

    <button 
      onClick={handleBookNow} 
      className="px-8 py-4 text-xl font-extrabold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-2xl hover:from-pink-500 hover:to-purple-600 transition-all duration-300 w-full md:w-auto transform hover:scale-105 active:scale-95 border-2 border-white flex items-center justify-center gap-2"
    >
    
      Book Now
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-1 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </button>


  </div>

  {/* Content Section: conditionally render each tab */}
  {activeTab === "overview" && (
    <div className="bg-white rounded-xl shadow-lg p-8 space-y-8 border border-orange-100">
      {/* Top Row: Venue Name and Owner Info */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h2>
          <p className="text-lg text-orange-600 font-medium">
            Premier Event Destination
          </p>
        </div>

{/* Owner Card */}
<div className="w-full lg:w-96">
  <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-xl">
    <div className="relative">
      <div className="p-2 bg-red-100 rounded-full">
        <img
          src={
            venue.owner?.profile_image
              ? getImageUrl(venue.owner.profile_image)
              : "https://via.placeholder.com/80"
          }
          alt="Owner"
          className="w-16 h-16 rounded-full object-cover"
        />
      </div>
      {venue.verification_status === "Verified" && (
        <MdVerified
          className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full p-0.5 shadow-sm"
          size={20}
        />
      )}
    </div>
    <div className="flex-1">
      <p className="text-lg font-semibold text-gray-900">
        {venue.owner?.name || "Venue Owner"}
      </p>
      {venue.owner?.email && (
        <p className="text-sm text-gray-600 mt-1">{venue.owner.email}</p>
      )}
    </div>
  </div>
</div>
      </div>

      {/* Description */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-orange-500 pl-4">
          Description
        </h3>
        <p className="text-gray-700 text-lg leading-relaxed">
          {venue.description}
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-orange-500 pl-4">
          Features
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {venue.features &&
            venue.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg"
              >
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
        </ul>
      </div>

      {/* Three-Column Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Halls Info */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
          <h4 className="text-xl font-bold text-gray-900 mb-4">Halls Info</h4>
          <div className="space-y-3 text-gray-700">
            <p>No. of halls: {halls.length}</p>
            <p>
              Capacities:{" "}
              {halls.length > 0
                ? halls.map((hall) => hall.capacity).join(" & ")
                : "N/A"}
            </p>
            <p>Per Plate: {pricePerPlate ? `Rs. ${pricePerPlate}` : "N/A"}</p>
            {halls.length > 0 && (
              <div className="mt-4">
                <label
                  htmlFor="hall-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Hall:
                </label>
                <select
                  id="hall-select"
                  value={selectedHall}
                  onChange={handleHallSelect}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {halls.map((hall) => (
                    <option key={hall._id} value={hall._id}>
                      {hall.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Payment Policy */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
          <h4 className="text-xl font-bold text-gray-900 mb-4">
            Payment Policy
          </h4>
          <div className="space-y-3 text-gray-700">
            <p>Advance: {venue.payment_policy.advance_percentage}%</p>
            <p>Security Deposit: {venue.payment_policy.security_deposit}</p>
            <p>Refund: {venue.payment_policy.refund_policy}</p>
            <p>Cancellation: {venue.payment_policy.cancellation_penalty}</p>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
          <h4 className="text-xl font-bold text-gray-900 mb-4">
            Contact Details
          </h4>
          <div className="space-y-3 text-gray-700">
            <p>Phone: {venue.contact_details.phone}</p>
            <p>Email: {venue.contact_details.email}</p>
            <p> Location: {venue.location.address}</p>
          </div>
        </div>
      </div>
    </div>
  )}
  {activeTab === "completed-events" && (
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Completed Events
            </h2>
            {mockCompletedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCompletedEvents.map((event, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                  >
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {event.name}
                      </h3>
                      <p className="text-gray-600 mt-2">
                        {event.short_description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No completed events available.</p>
            )}
          </div>
        )}

        {/* Render ReviewsList when activeTab is "reviews" */}
        {activeTab === "reviews" && <ReviewsList venueId={id} />}
  
</section>

      {/* Messaging Feature */}
      {!chatOpen && (
        <div
          className="fixed bottom-20 right-6 bg-orange-500 p-4 rounded-full cursor-pointer text-white shadow-2xl hover:scale-110 transition transform duration-300"
          onClick={openChat}
          title="Chat with Venue Owner"
        >
          <FaComments size={28} />
        </div>
      )}
      {chatOpen && (
        <ChatWidget partnerId={venue.owner?._id} onClose={closeChat} />
      )}

      <BottomNavbar />
    </div>
  );
};



export default PartyPalace;
