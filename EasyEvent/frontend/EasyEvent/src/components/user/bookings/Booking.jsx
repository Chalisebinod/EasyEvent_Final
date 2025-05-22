import React, { useState, useEffect } from "react"; 
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../Navbar";
import BottomNavbar from "../BottomNavbar";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaComments, FaUtensils, FaCalendarAlt, FaUsers, FaMoneyBillWave } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "../chat/ChatWidget";

const Booking = () => {
  const { id: venueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = localStorage.getItem("access_token");
  const [chatOpen, setChatOpen] = useState(false);

  // Receive partnerId from navigation state (if passed)
  const partnerIdFromState = location.state?.partnerId;
  console.log("partner Id", partnerIdFromState);

  // API data for halls and food
  const [halls, setHalls] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedHall, setSelectedHall] = useState(null);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  // selectedFoods will store the IDs of extra food items chosen by the user.
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [additionalServices, setAdditionalServices] = useState([
    { name: "", description: "" },
  ]);

  // New state for custom event type
  const [showCustomEventType, setShowCustomEventType] = useState(false);
  const [customEventType, setCustomEventType] = useState("");
  
  // Handler for event type select/custom
  const handleEventTypeChange = (e) => {
    const value = e.target.value;
    if (value === "Other") {
      setShowCustomEventType(true);
      setEventType("");
    } else {
      setShowCustomEventType(false);
      setCustomEventType("");
      setEventType(value);
    }
  };

  // Food type filter
  const [selectedFoodType, setSelectedFoodType] = useState("All");

  // Pricing fields
  const [originalPrice, setOriginalPrice] = useState(0);
  // Official total based solely on hall cost (without extra food)
  const officialTotal = guestCount ? guestCount * originalPrice : 0;

  // User offer
  const [offerMode, setOfferMode] = useState("perPlate");
  const [userOfferedValue, setUserOfferedValue] = useState("");
  const [offerError, setOfferError] = useState("");

  // Negotiated price computations
  const [finalPrice, setFinalPrice] = useState(0); // Negotiated price per plate
  const [totalCostFinal, setTotalCostFinal] = useState(0); // Total negotiated cost (offer * guestCount)
  // Extra food cost (price per plate multiplied by guest count for each selected food)
  const [extraFoodCost, setExtraFoodCost] = useState(0);
  // Grand total (for negotiation) = totalCostFinal + extraFoodCost
  const grandTotal = totalCostFinal + extraFoodCost;

  // Capacity error
  const [capacityError, setCapacityError] = useState("");

  // Chat feature
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const [dateError, setDateError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // New state for booking submission status
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSendMessage = () => {
    if (chatInput.trim() === "") return;
    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: chatInput,
      time: new Date().toLocaleTimeString(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput("");
  };

  // Fetch halls with included food populated
  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/halls/${venueId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setHalls(data.halls || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching halls:", err);
        setLoading(false);
      });
  }, [venueId, accessToken]);

  // Fetch foods
  useEffect(() => {
    if (!venueId) return;
    fetch(`http://localhost:8000/api/food/venue/${venueId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setFoods(data.foods || []))
      .catch((err) => console.error("Error fetching foods:", err));
  }, [venueId, accessToken]);

  // Compute negotiated price whenever offer changes
  useEffect(() => {
    if (guestCount && userOfferedValue) {
      const count = parseInt(guestCount);
      const offerVal = parseFloat(userOfferedValue);
      const offeredPerPlate =
        offerMode === "perPlate" ? offerVal : count ? offerVal / count : 0;
      setFinalPrice(offeredPerPlate);
      setTotalCostFinal(offeredPerPlate * count);
    }
  }, [guestCount, userOfferedValue, offerMode]);

  // Recalculate extra food cost when extra food selection or guest count changes
  useEffect(() => {
    if (!guestCount) return;
    const cost = selectedFoods.reduce((acc, foodId) => {
      const food = foods.find((item) => item._id === foodId);
      return food ? acc + parseFloat(food.price) * parseInt(guestCount) : acc;
    }, 0);
    setExtraFoodCost(cost);
  }, [selectedFoods, foods, guestCount]);

  // Validate guest count
  const handleGuestCountChange = (e) => {
    const value = e.target.value;
    if (selectedHall && parseInt(value) > selectedHall.capacity) {
      setCapacityError(
        `Maximum capacity for ${selectedHall.name} is ${selectedHall.capacity} guests.`
      );
    } else {
      setCapacityError("");
    }
    setGuestCount(value);
  };

  const handleDateChange = (e) => {
    const selected = e.target.value;
    if (selected < today) {
      setDateError("Event date cannot be in the past.");
    } else {
      setDateError("");
    }
    setEventDate(selected);
  };

  const openChat = () => setChatOpen(true);
  const closeChat = () => setChatOpen(false);

  // Validate user offer
  const handleUserOfferedValueChange = (e) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    const minOffer =
      offerMode === "perPlate" ? originalPrice * 0.7 : officialTotal * 0.7;
    if (numValue < minOffer) {
      setOfferError(
        `Minimum allowed offer is ${minOffer.toFixed(2)} (${
          offerMode === "perPlate" ? "per plate" : "total"
        }).`
      );
    } else {
      setOfferError("");
    }
    setUserOfferedValue(value);
  };

  useEffect(() => {
    if (bookingSubmitted) {
      // after 3 seconds navigate
      const timer = setTimeout(() => {
        navigate("/user-dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bookingSubmitted, navigate]);
  
  // Toggle extra food selection
  const toggleFoodSelection = (foodId) => {
    if (selectedFoods.includes(foodId)) {
      setSelectedFoods(selectedFoods.filter((id) => id !== foodId));
    } else {
      setSelectedFoods([...selectedFoods, foodId]);
    }
  };

  // Additional services handlers
  const handleServiceChange = (index, field, value) => {
    const newServices = [...additionalServices];
    newServices[index][field] = value;
    setAdditionalServices(newServices);
  };
  
  const addService = () =>
    setAdditionalServices((prev) => [...prev, { name: "", description: "" }]);
    
  const removeService = (index) => {
    const newServices = [...additionalServices];
    newServices.splice(index, 1);
    setAdditionalServices(newServices);
  };

  // Submit booking form. Note: The payload now includes both "selected_foods" and an extra field "requested_foods"
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedHall) {
      toast.error("Please select a hall.");
      return;
    }
    if (!eventType || !eventDate || !guestCount) {
      toast.error("Please fill in all event details.");
      return;
    }
    if (capacityError) {
      toast.error("Please adjust guest count as per hall capacity.");
      return;
    }
    if (offerError) {
      toast.error(offerError);
      return;
    }
    
    setSubmitting(true);
    
    const offeredPerPlate =
      offerMode === "perPlate"
        ? parseFloat(userOfferedValue)
        : parseFloat(userOfferedValue) / parseInt(guestCount);
    const finalP = Math.round(
      (parseFloat(originalPrice) + offeredPerPlate) / 2
    );
    const payload = {
      venue: venueId,
      hall: selectedHall._id,
      event_details: {
        event_type: eventType,
        date: eventDate,
        guest_count: parseInt(guestCount),
      },
      // Here we send the selected food IDs so the backend can store them
      selected_foods: selectedFoods,
      additional_services: additionalServices,
      pricing: {
        original_per_plate_price: parseFloat(originalPrice),
        user_offered_per_plate_price: offeredPerPlate,
        final_per_plate_price: finalP,
        total_cost: finalP * parseInt(guestCount) + extraFoodCost,
      },
    };

    fetch("http://localhost:8000/api/booking/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.message || "Failed to create booking");
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Booking created:", data);
        toast.success("Booking request submitted successfully!");
        setBookingSubmitted(true);
        setSubmitting(false);
      })
      .catch((err) => {
        console.error("Error creating booking:", err);
        toast.error(
          err.message || "Failed to create booking. Please try again."
        );
        setSubmitting(false);
      });
  };

  // Filter extra foods (exclude those already included in the hall)
  const extraFoods =
    selectedHall &&
    selectedHall.includedFood &&
    selectedHall.includedFood.length > 0
      ? foods.filter(
          (food) =>
            !selectedHall.includedFood.some((inc) => inc._id === food._id)
        )
      : foods;
  const filteredFoods =
    selectedFoodType === "All"
      ? extraFoods
      : extraFoods.filter((food) => {
          const cat = food.category.toLowerCase();
          return selectedFoodType === "Veg" ? cat === "veg" : cat !== "veg";
        });

        return (
          <div className="flex flex-col min-h-screen bg-white">
            {/* Top Content Area */}
            <div className="flex-1">
              <Navbar />
              <ToastContainer position="top-center" autoClose={3000} />
              
              <div className="max-w-screen-xl mx-auto px-4 py-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white shadow-2xl rounded-2xl p-6 md:p-10"
                >
                  {/* <div className="flex justify-center items-center mb-8">
                    <div className="relative">
                      <p className="text-4xl md:text-3xl font-semibold text-transparent bg-clip-text bg-black">
                        Book Your Event
                      </p>
                      <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-700 rounded-full"></div>
                    </div>
                  </div> */}
                  
                  <form onSubmit={handleSubmit} className="space-y-16">
                    {/* Hall Selection */}
                    <section>
                      <div className="flex items-center mb-6">
                        <div className="bg-orange-100 p-2 rounded-lg mr-3">
                          <FaUserCircle className="text-orange-500 text-xl" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                          Select a Hall
                        </h2>
                      </div>
                      
                      {loading ? (
                        <div className="flex justify-center items-center h-48">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {halls.map((hall) => (
                            <motion.div
                              key={hall._id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                              className={`border rounded-2xl overflow-hidden shadow-md transition-all duration-300 ${
                                selectedHall && selectedHall._id === hall._id
                                  ? "border-orange-500 shadow-orange-100 ring-2 ring-orange-500 ring-opacity-50"
                                  : "border-gray-200 hover:shadow-lg"
                              } ${
                                !hall.isAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              }`}
                              onClick={() => {
                                if (!hall.isAvailable) return;
                                setSelectedHall(hall);
                                setOriginalPrice(
                                  hall.pricePerPlate || hall.basePricePerPlate
                                );
                                setSelectedFoods([]);
                              }}
                            >
                              <div className="relative">
                                {hall.images && hall.images.length > 0 ? (
                                  <img
                                    src={`http://localhost:8000/${hall.images[0].replace(
                                      /\\/g,
                                      "/"
                                    )}`}
                                    alt={hall.name}
                                    className="w-full h-56 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">No Image</span>
                                  </div>
                                )}
                                {selectedHall && selectedHall._id === hall._id && (
                                  <div className="absolute top-3 right-3 bg-orange-500 text-white p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-800">{hall.name}</h3>
                                <div className="flex items-center mt-2 text-gray-600">
                                  <FaUsers className="mr-2" />
                                  <span>Capacity: {hall.capacity} guests</span>
                                </div>
                                {!hall.isAvailable && (
                                  <div className="mt-2 inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                                    Not Available
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </section>
      
                    {/* Included Food Items */}
                    {selectedHall &&
                      selectedHall.includedFood &&
                      selectedHall.includedFood.length > 0 && (
                        <motion.section
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="flex items-center mb-6">
                            <div className="bg-green-100 p-2 rounded-lg mr-3">
                              <FaUtensils className="text-green-500 text-xl" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                              Included Food Items
                            </h2>
                          </div>
                          <div className="bg-white p-6 rounded-xl border border-green-100">
                            <div className="flex flex-wrap gap-3">
                              {selectedHall.includedFood.map((food) => (
                                <div
                                  key={food._id}
                                  className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium flex items-center shadow-sm"
                                >
                                  <span className="mr-2">✓</span>
                                  {food.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.section>
                      )}
      
                    {/* Event Details */}
                    <section>
                      <div className="flex items-center mb-6">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <FaCalendarAlt className="text-blue-500 text-xl" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                          Event Details
                        </h2>
                      </div>
                      <div className="bg-white p-6 rounded-xl border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
  <label className="block text-gray-700 font-medium mb-2">Event Type</label>
  <select
    value={showCustomEventType ? "Other" : eventType}
    onChange={handleEventTypeChange}
    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
  >
    <option value="">Select Event Type</option>
    <option value="Marriage">Marriage</option>
    <option value="Birthday">Birthday</option>
    <option value="Corporate">Corporate</option>
    <option value="Other">Other</option>
  </select>
  {showCustomEventType && (
    <div className="mt-3">
      <label className="block text-gray-700 font-medium mb-2">
        Custom Event Type
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Enter custom event type"
          value={customEventType}
          onChange={(e) => {
            setCustomEventType(e.target.value);
            setEventType(e.target.value);
          }}
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  )}
</div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">
                              Event Date
                            </label>
                            <input
                              type="date"
                              value={eventDate}
                              onChange={handleDateChange}
                              min={today}
                              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                            />
                            {dateError && (
                              <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {dateError}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">
                              Guest Count
                            </label>
                            <input
                              type="number"
                              value={guestCount}
                              onChange={handleGuestCountChange}
                              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                              min="1"
                              placeholder="Number of guests"
                            />
                            {capacityError && (
                              <p className="text-red-500 text-sm mt-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {capacityError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
      
                    {/* Extra Food Selection */}
                    <section>
  <div className="flex items-center mb-6">
    <div className="bg-orange-100 p-2 rounded-lg mr-3">
      <FaUtensils className="text-orange-500 text-xl" />
    </div>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
      Additional Food Items
    </h2>
  </div>

  <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
    {/* Filter Buttons */}
    <div className="flex gap-3 mb-6">
      {["All", "Veg", "Non Veg"].map((type) => (
        <motion.button
          key={type}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          type="button"
          onClick={() => setSelectedFoodType(type)}
          className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            selectedFoodType === type
              ? "bg-orange-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {type}
        </motion.button>
      ))}
    </div>

    {/* Food Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {filteredFoods && filteredFoods.length > 0 ? (
        filteredFoods.map((food) => (
          <motion.div
            key={food._id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
              selectedFoods.includes(food._id)
                ? "border-orange-500 bg-white shadow-md"
                : "border-gray-200 hover:border-orange-300 hover:shadow-sm"
            }`}
            onClick={() => toggleFoodSelection(food._id)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-800">{food.name}</p>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedFoods.includes(food._id)
                    ? "border-orange-500 bg-orange-500"
                    : "border-gray-300"
                }`}
              >
                {selectedFoods.includes(food._id) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>

            <div className="mt-10 bg-green-600 px-2 py-2 rounded-md text-white text-sm font-medium text-center hover:bg-green-700 transition-colors">
              <p>Rs. {food.price}</p>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="col-span-full text-center py-10 text-gray-500">
          No additional food items available.
        </div>
      )}
    </div>
  </div>
</section>


  {/* Additional Services */}
  <section>
                 
  <div className="flex items-center mb-6">
                    <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Additional Services
                    </h2>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-yellow-100">
                    {additionalServices.map((service, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border border-yellow-200 rounded-xl p-5 mb-5 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                            <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                              {index + 1}
                            </span>
                            Service {index + 1}
                          </h3>
                          {additionalServices.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeService(index)}
                              className="text-red-500 hover:text-red-700 transition-colors duration-200 flex items-center text-sm font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">
                              Service Name
                            </label>
                            <input
                              type="text"
                              value={service.name}
                              onChange={(e) => {
                                // strip out any non-letter/space chars
                                const onlyText = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                handleServiceChange(index, "name", onlyText);
                              }}
                              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter service name"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-2">
                              Description
                            </label>
                            <textarea
                              value={service.description}
                              onChange={(e) => {
                                // strip out any non-letter/space chars
                                const onlyText = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                handleServiceChange(index, "description", onlyText);
                              }}
                              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter description"
                              rows="3"
                            ></textarea>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={addService}
                      className="inline-flex items-center px-5 py-2.5 bg-orange-500 text-white rounded-lg transition-all duration-300 shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Service
                    </motion.button>
                  </div>
                </section>

                {/* Pricing Section */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                      <FaMoneyBillWave className="text-indigo-500 text-xl" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Pricing
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Official Pricing */}
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm transform transition-all duration-300 hover:shadow-md">
                      <h3 className="text-xl font-bold mb-5 text-indigo-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Official Pricing
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="block text-gray-700 font-medium mb-2">
                            Price per Plate
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                              Rs.
                            </span>
                            <input
                              type="number"
                              value={originalPrice}
                              readOnly
                              className="pl-10 w-full border border-gray-300 rounded-lg p-3 bg-white shadow-inner text-gray-700 font-medium"
                            />
                          </div>
                        </div>
                        <div className="relative">
                          <label className="block text-gray-700 font-medium mb-2">
                            Extra Food Cost
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                              Rs.
                            </span>
                            <input
                              type="number"
                              value={guestCount ? extraFoodCost.toFixed(2) : 0}
                              readOnly
                              className="pl-10 w-full border border-gray-300 rounded-lg p-3 bg-white shadow-inner text-gray-700 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 relative">
                        <label className="block text-gray-700 font-medium mb-2">
                          Grand Official Price
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                            Rs.
                          </span>
                          <input
                            type="number"
                            value={
                              guestCount
                                ? (
                                    parseFloat(originalPrice) * parseInt(guestCount) +
                                    extraFoodCost
                                  ).toFixed(2)
                                : 0
                            }
                            readOnly
                            className="pl-10 w-full border border-gray-300 rounded-lg p-3 shadow-inner text-indigo-800 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Your Offer */}
                    <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm transform transition-all duration-300 hover:shadow-md">
                      <h3 className="text-xl font-bold mb-5 text-orange-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Your Offer
                      </h3>
                      <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                          Select Offer Type
                        </label>
                        <div className="flex flex-wrap gap-4">
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            type="button"
                            onClick={() => {
                              setOfferMode("perPlate");
                              setUserOfferedValue("");
                              setOfferError("");
                            }}
                            className={`px-5 py-2 rounded-lg transition-all duration-300 shadow-sm flex items-center ${
                              offerMode === "perPlate"
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            Per Plate
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            type="button"
                            onClick={() => {
                              setOfferMode("total");
                              setUserOfferedValue("");
                              setOfferError("");
                            }}
                            className={`px-5 py-2 rounded-lg transition-all duration-300 shadow-sm flex items-center ${
                              offerMode === "total"
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Total
                          </motion.button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {offerMode === "perPlate" ? (
                          <>
                            <div className="relative">
                              <label className="block text-gray-700 font-medium mb-2">
                                Offered Price per Plate
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                                  Rs.
                                </span>
                                <input
                                  type="number"
                                  value={userOfferedValue}
                                  onChange={handleUserOfferedValueChange}
                                  placeholder="Enter your offered price"
                                  className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                            </div>
                            <div className="relative">
                              <label className="block text-gray-700 font-medium mb-2">
                                Total Offer
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                                  Rs.
                                </span>
                                <input
                                  type="number"
                                  value={
                                    guestCount && userOfferedValue
                                      ? guestCount * userOfferedValue
                                      : ""
                                  }
                                  readOnly
                                  className="pl-10 w-full border border-gray-300 rounded-lg p-3 bg-white shadow-inner text-gray-700 font-medium"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <label className="block text-gray-700 font-medium mb-2">
                                Offered Total Price
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                                  Rs.
                                </span>
                                <input
                                  type="number"
                                  value={userOfferedValue}
                                  onChange={handleUserOfferedValueChange}
                                  placeholder="Enter your offered total price"
                                  className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                            </div>
                            <div className="relative">
                              <label className="block text-gray-700 font-medium mb-2">
                                Equivalent Price per Plate
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600">
                                  Rs.
                                </span>
                                <input
                                  type="number"
                                  value={
                                    guestCount && userOfferedValue
                                      ? (userOfferedValue / guestCount).toFixed(2)
                                      : ""
                                  }
                                  readOnly
                                  className="pl-10 w-full border border-gray-300 rounded-lg p-3 bg-white shadow-inner text-gray-700 font-medium"
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      {offerError && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {offerError}
                        </p>
                      )}
                      <div className="mt-6 p-4  rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-gray-700">Final Accepted Price per Plate:</p>
                          <p className="font-bold">Rs. {finalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-gray-700">Total Final Cost:</p>
                          <p className="font-bold ">Rs. {totalCostFinal.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-gray-700 flex items-center">
                            Extra Food Cost:
                            <span className="text-xs ml-1 text-gray-500">(for selected extras)</span>
                          </p>
                          <p className="font-bold">Rs. {extraFoodCost.toFixed(2)}</p>
                        </div>
                        <div className="h-px bg-orange-200 my-3"></div>
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-medium text-gray-800">Grand Total:</p>
                          <p className="text-xl font-bold text-green-600">Rs. {grandTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex justify-center mt-10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={bookingSubmitted || submitting}
                    className={`px-10 py-4 font-bold text-lg rounded-xl shadow-lg transition-all duration-300 flex items-center ${
                      bookingSubmitted
                        ? "bg-green-600 text-white cursor-not-allowed"
                        : submitting
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:from-orange-600 hover:to-orange-700"
                    }`}
                  >
                    {bookingSubmitted ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Booking Submitted
                      </>
                    ) : submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Booking Request
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        
        
        <AnimatePresence>
          {!chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-20 right-6 z-50"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openChat}
                className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-full text-white shadow-lg hover:shadow-xl flex items-center justify-center"
                title="Chat with Venue Owner"
              >
                <FaComments size={28} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {chatOpen && (
          <ChatWidget partnerId={partnerIdFromState} onClose={closeChat} />
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Booking;