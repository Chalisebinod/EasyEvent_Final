const BookingRequest = require("../model/request");
const Venue = require("../model/venue");
const Hall = require("../model/hallSchema");

// User books an event
async function bookEvent(req, res) {
  try {
    // Assuming authentication middleware is already setting req.user with the logged-in user data
    const userId = req.user.id; // Use req.user.id to get the authenticated user's ID

    const { venue, hall, event_details, selected_foods, pricing } = req.body;

    // Validate required fields
    if (!venue || !hall || !event_details || !pricing) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch venue to check if it exists
    const venueData = await Venue.findById(venue);
    if (!venueData) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Fetch hall to check if it exists in the venue
    const hallData = await Hall.findById(hall);
    if (!hallData) {
      return res.status(404).json({ message: "Hall not found" });
    }

    // Calculate total cost
    const guestCount = event_details.guest_count;
    const finalPrice =
      pricing.final_per_plate_price || pricing.original_per_plate_price;
    const totalCost = guestCount * finalPrice;

    // Create new booking request with userId
    const newBooking = new BookingRequest({
      user: userId, // Store the user ID to associate this booking with the authenticated user
      venue,
      hall,
      event_details,
      selected_foods,
      pricing: {
        original_per_plate_price: pricing.original_per_plate_price,
        user_offered_per_plate_price: pricing.user_offered_per_plate_price,
        final_per_plate_price: finalPrice,
        total_cost: totalCost,
      },
      status: "Pending",
      payment_status: "Unpaid",
    });

    // Save the new booking request to MongoDB
    await newBooking.save();

    return res
      .status(201)
      .json({ message: "Booking request submitted", booking: newBooking });
  } catch (error) {
    console.error("Error booking event:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// User sees their booking details
async function getBookingDetails(req, res) {
  try {
    // Assuming authentication middleware is setting req.user with the logged-in user data
    const userId = req.user.id; // Get the authenticated user's ID

    const { bookingId } = req.params;

    // Fetch booking only if it belongs to the logged-in user
    const booking = await BookingRequest.findOne({
      _id: bookingId,
      user: userId,
    })
      .populate("user", "name email")
      .populate("venue", "name location")
      .populate("hall", "name capacity")
      .populate("selected_foods");

    if (!booking) {
      return res
        .status(404)
        .json({
          message:
            "Booking not found or you do not have permission to access it",
        });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// User deletes a booking
async function deleteBooking(req, res) {
  try {
    // Assuming authentication middleware is setting req.user with the logged-in user data
    const userId = req.user.id; // Get the authenticated user's ID

    const { bookingId } = req.params;

    // Fetch booking only if it belongs to the logged-in user
    const booking = await BookingRequest.findOne({
      _id: bookingId,
      user: userId,
    });

    if (!booking) {
      return res
        .status(404)
        .json({
          message:
            "Booking not found or you do not have permission to delete it",
        });
    }

    await BookingRequest.findByIdAndDelete(bookingId);

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = { bookEvent, getBookingDetails, deleteBooking };
