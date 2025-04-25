import React, { useState, useEffect } from "react"; 
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../Navbar";
import BottomNavbar from "../BottomNavbar";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaComments } from "react-icons/fa";
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
    fetch(`http://localhost:8000/api/halls/${venueId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setHalls(data.halls || []))
      .catch((err) => console.error("Error fetching halls:", err));
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
      alert("Please select a hall.");
      return;
    }
    if (!eventType || !eventDate || !guestCount) {
      alert("Please fill in all event details.");
      return;
    }
    if (capacityError) {
      alert("Please adjust guest count as per hall capacity.");
      return;
    }
    if (offerError) {
      alert(offerError);
      return;
    }
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
      })
      .catch((err) => {
        console.error("Error creating booking:", err);
        toast.error(
          err.message || "Failed to create booking. Please try again."
        );
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
    <div className="flex flex-col min-h-screen">
      {/* Top Content Area */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-gray-100">
        <Navbar />
        <ToastContainer />
        <div className="max-w-screen-xl mx-auto bg-white shadow-lg rounded-xl p-10 my-8">
          <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
            Book Your Event
          </h1>
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Hall Selection */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">
                Select a Hall
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {halls.map((hall) => (
                  <div
                    key={hall._id}
                    className={`border rounded-xl p-4 cursor-pointer transition transform hover:scale-105 ${
                      selectedHall && selectedHall._id === hall._id
                        ? "border-orange-500 shadow-2xl"
                        : "border-gray-300"
                    } ${
                      !hall.isAvailable ? "opacity-50 cursor-not-allowed" : ""
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
                    {hall.images && hall.images.length > 0 ? (
                      <img
                        src={`http://localhost:8000/${hall.images[0].replace(
                          /\\/g,
                          "/"
                        )}`}
                        alt={hall.name}
                        className="w-full h-48 object-cover rounded-xl mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                        No Image
                      </div>
                    )}
                    <p className="text-center font-medium text-lg">
                      {hall.name}
                    </p>
                    <p className="text-center text-sm text-gray-600">
                      Capacity: {hall.capacity}
                    </p>
                    {!hall.isAvailable && (
                      <p className="text-center text-red-500 mt-2">
                        Not Available
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Included Food Items */}
            {selectedHall &&
              selectedHall.includedFood &&
              selectedHall.includedFood.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">
                    Included Food Items
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {selectedHall.includedFood.map((food) => (
                      <div
                        key={food._id}
                        className="px-4 py-2 bg-green-100 text-green-800 rounded-full"
                      >
                        {food.name}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* Event Details */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">
                Event Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Event Type</option>
                    <option value="Marriage">Marriage</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={handleDateChange}
                    min={today}
                    className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {dateError && (
                    <p className="text-red-500 text-sm mt-1">{dateError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={handleGuestCountChange}
                    className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="1"
                  />
                  {capacityError && (
                    <p className="text-red-500 text-sm mt-1">{capacityError}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Extra Food Selection */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">
                Additional Food Items
              </h2>
              <div className="flex space-x-4 mb-6">
                {["All", "Veg", "Non Veg"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedFoodType(type)}
                    className={`px-4 py-2 rounded-full transition ${
                      selectedFoodType === type
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {filteredFoods && filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <div
                      key={food._id}
                      className={`border rounded-xl p-3 cursor-pointer transition transform hover:scale-105 ${
                        selectedFoods.includes(food._id)
                          ? "border-orange-500 shadow-xl"
                          : "border-gray-300"
                      }`}
                      onClick={() => toggleFoodSelection(food._id)}
                    >
                      <p className="text-center text-sm font-medium">
                        {food.name}
                      </p>
                      <p className="text-center text-xs text-gray-600">
                        Rs.{food.price}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-600">
                    No additional food items available.
                  </div>
                )}
              </div>
            </section>

            {/* Additional Services */}
            <section>
  <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">
    Additional Services
  </h2>
  {additionalServices.map((service, index) => (
    <div key={index} className="border p-4 rounded-xl mb-6">
      <div className="flex justify-between items-center mb-3">
        <p className="font-medium text-lg">Service {index + 1}</p>
        {additionalServices.length > 1 && (
          <button
            type="button"
            onClick={() => removeService(index)}
            className="text-red-500 text-sm"
          >
            Remove
          </button>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium">
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
          className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter service name"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium">
          Description
        </label>
        <textarea
          value={service.description}
          onChange={(e) => {
            // strip out any non-letter/space chars
            const onlyText = e.target.value.replace(/[^A-Za-z\s]/g, "");
            handleServiceChange(index, "description", onlyText);
          }}
          className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter description"
        ></textarea>
      </div>
    </div>
  ))}
  <button
    type="button"
    onClick={addService}
    className="px-4 py-2 bg-orange-500 text-white rounded-full transition hover:bg-orange-600"
  >
    Add Service
  </button>
</section>

            {/* Pricing Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-6">
                Pricing
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {/* Official Pricing */}
                <div className="p-6 border rounded-xl bg-gray-50 shadow-inner">
                  <h3 className="text-xl font-semibold mb-4">
                    Official Pricing
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium">
                        Price per Plate
                      </label>
                      <input
                        type="number"
                        value={originalPrice}
                        readOnly
                        className="mt-2 w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium">
                        Extra Food Cost
                      </label>
                      <input
                        type="number"
                        value={guestCount ? extraFoodCost.toFixed(2) : 0}
                        readOnly
                        className="mt-2 w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-gray-700 font-medium">
                      Grand Official Price
                    </label>
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
                      className="mt-2 w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                    />
                  </div>
                </div>

                {/* Your Offer */}
                <div className="p-6 border rounded-xl bg-gray-50 shadow-inner">
                  <h3 className="text-xl font-semibold mb-4">Your Offer</h3>
                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Select Offer Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOfferMode("perPlate");
                          setUserOfferedValue("");
                          setOfferError("");
                        }}
                        className={`px-4 py-2 rounded-full transition ${
                          offerMode === "perPlate"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        Per Plate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferMode("total");
                          setUserOfferedValue("");
                          setOfferError("");
                        }}
                        className={`px-4 py-2 rounded-full transition ${
                          offerMode === "total"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        Total
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {offerMode === "perPlate" ? (
                      <>
                        <div>
                          <label className="block text-gray-700 font-medium">
                            Offered Price per Plate
                          </label>
                          <input
                            type="number"
                            value={userOfferedValue}
                            onChange={handleUserOfferedValueChange}
                            placeholder="Enter your offered price"
                            className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium">
                            Total Offer
                          </label>
                          <input
                            type="number"
                            value={
                              guestCount && userOfferedValue
                                ? guestCount * userOfferedValue
                                : ""
                            }
                            readOnly
                            className="mt-2 w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-gray-700 font-medium">
                            Offered Total Price
                          </label>
                          <input
                            type="number"
                            value={userOfferedValue}
                            onChange={handleUserOfferedValueChange}
                            placeholder="Enter your offered total price"
                            className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium">
                            Equivalent Price per Plate
                          </label>
                          <input
                            type="number"
                            value={
                              guestCount && userOfferedValue
                                ? (userOfferedValue / guestCount).toFixed(2)
                                : ""
                            }
                            readOnly
                            className="mt-2 w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {offerError && (
                    <p className="text-red-500 text-sm mt-2">{offerError}</p>
                  )}
                  <div className="mt-6 p-4 border-t">
                    <p className="text-gray-700">
                      Final Accepted Price per Plate:{" "}
                      <span className="font-semibold">{finalPrice}</span>
                    </p>
                    <p className="text-gray-700">
                      Total Final Cost:{" "}
                      <span className="font-semibold">{totalCostFinal}</span>
                    </p>
                    <p className="text-gray-700">
                      Extra Food Cost:{" "}
                      <span className="font-semibold">
                        Rs.{extraFoodCost.toFixed(2)}
                      </span>{" "}
                      <span className="text-sm">
                        (for your selected extra food)
                      </span>
                    </p>
                    <p className="text-gray-700 text-xl">
                      Grand Total (Your Offer + Extras):{" "}
                      <span className="font-bold">
                        Rs.{grandTotal.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="text-center">
              <button
                type="submit"
                className={`px-10 py-4 font-bold rounded-full shadow-lg transition ${
                  bookingSubmitted
                    ? "bg-green-700 text-white"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-2xl"
                }`}
                disabled={bookingSubmitted}
              >
                {bookingSubmitted
                  ? "Booking submitted"
                  : "Submit Booking Request"}
              </button>
            </div>
          </form>
        </div>
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
          <ChatWidget partnerId={partnerIdFromState} onClose={closeChat} />
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Booking;
