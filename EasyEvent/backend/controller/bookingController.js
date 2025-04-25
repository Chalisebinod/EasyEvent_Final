const Booking = require("../model/bookingSchema");
const User = require("../model/user");
const VenueOwner = require("../model/venueOwner");
const Venue = require("../model/venue");
const BookingRequest = require("../model/request");
const nodemailer = require("nodemailer");
const Request = require("../model/request")
// Create a new booking
exports.createBooking = async (req, res) => {
  const userId = req.user.id;
  try {
    const {
      venue,
      hall,
      event_details,
      selected_foods,
      requested_foods,
      additional_services,
      pricing,
    } = req.body;

    // Check if the user exists in either User or VenueOwner collections
    const userExists = await User.findById(userId);
    const venueOwnerExists = await VenueOwner.findById(userId);
    if (!userExists && !venueOwnerExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally, prevent duplicate booking per venue
    const existingBooking = await Booking.findOne({
      user: userId,
      venue,
      isDeleted: false,
    });
    if (existingBooking) {
      return res.status(400).json({
        message:
          "You have already booked this venue. Only one booking per venue is allowed.",
      });
    }

    const booking = new Booking({
      user: userId,
      venue,
      hall,
      event_details,
      selected_foods: Array.isArray(selected_foods) ? selected_foods : [],
      requested_foods: Array.isArray(requested_foods) ? requested_foods : [],
      additional_services,
      pricing,
    });
    const savedBooking = await booking.save();
    res.status(201).json({ booking: savedBooking });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

// Update/edit an existing booking
exports.updateBooking = async (req, res) => {
  const bookingId = req.params.id;
  try {
    const updateData = req.body;
    // Prevent modifying soft delete flag via update.
    delete updateData.isDeleted;
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    );
    res.status(200).json({ booking: updatedBooking });
  } catch (error) {
    console.error("Update Booking Error:", error);
    res
      .status(500)
      .json({ message: "Failed to update booking", error: error.message });
  }
};

// Soft delete a booking (set isDeleted to true)
exports.deleteBooking = async (req, res) => {
  const bookingId = req.params.id;
  try {
    // Optionally, you can check if payment_status is "Paid" before allowing deletion.
    const deletedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { isDeleted: true },
      { new: true }
    );
    res
      .status(200)
      .json({
        booking: deletedBooking,
        message: "Booking soft-deleted successfully",
      });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete booking", error: error.message });
  }
};

// Get all bookings for a given venue with filtering/sorting
exports.getBookings = async (req, res) => {
  const venueId = req.params.venueId;
  // Optionally, a query parameter "period" may be provided (Past, Current, Future)
  const { period } = req.query;
  try {
    const filter = { venue: venueId, isDeleted: false };
    if (period) {
      filter.booking_period = period;
    }
    // Optionally sort by event date ascending (earliest first)
    const bookings = await Booking.find(filter)
      .populate("user", "name email profile_image")
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price")
      .sort({ "event_details.date": 1 });
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get Bookings Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

// Update booking status for both request and confirmed bookings
exports.updateBookingStatus = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { bookingId, requestId, isCompleted } = req.body;

    if (typeof isCompleted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isCompleted must be a boolean value",
      });
    }

    if (!bookingId || !requestId) {
      return res.status(400).json({
        success: false,
        message: "Both bookingId and requestId are required",
      });
    }

    // First find both the booking and request to verify they exist
    const [booking, request] = await Promise.all([
      Booking.findById(bookingId).populate("user venue"),
      BookingRequest.findById(requestId),
    ]);

    if (!booking || !request) {
      return res.status(404).json({
        success: false,
        message: !booking ? "Booking not found" : "Request not found",
      });
    }

    // Verify they belong to the same venue and user
    if (
      booking.venue._id.toString() !== request.venue.toString() ||
      booking.user._id.toString() !== request.user.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking and request details do not match",
      });
    }

    // Check if the venue belongs to the owner
    const venue = await Venue.findOne({
      _id: booking.venue._id,
      owner: ownerId,
    });

    if (!venue) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking's status",
      });
    }

    // Update both BookingRequest and Booking models using their respective IDs
    const [updatedBooking, updatedRequest] = await Promise.all([
      Booking.findByIdAndUpdate(
        bookingId,
        {
          booking_statius: isCompleted,
          status: isCompleted ? "Completed" : "Running",
        },
        { new: true }
      ),
      BookingRequest.findByIdAndUpdate(
        requestId,
        {
          booking_statius: isCompleted,
          status: isCompleted ? "Completed" : "Running",
        },
        { new: true }
      ),
    ]);

    // If event is marked as completed, send email to user with review link
    if (isCompleted) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width:600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #2e7d32; text-align: center;">Event Completed Successfully!</h2>
              <p>Dear ${booking.user.name},</p>
              <p>Your event at <strong>${booking.venue.name}</strong> has been marked as completed.</p>
              <p>We hope you had a wonderful experience! We would greatly appreciate if you could take a moment to share your feedback.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/review/${bookingId}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #2e7d32; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Share Your Review
                </a>
              </div>
              <p>Your feedback helps us improve our services and assists other users in making informed decisions.</p>
              <p style="text-align: right; margin-top: 20px;">Best regards,<br>${booking.venue.name} Team</p>
            </div>
          </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.user.email,
        subject: "Event Completed - Share Your Experience!",
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({
      success: true,
      message: `Booking marked as ${isCompleted ? "completed" : "incomplete"}`,
      data: {
        booking: updatedBooking,
        request: updatedRequest,
      },
    });
  } catch (error) {
    console.error("Update Booking Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: error.message,
    });
  }
};

// get my bookings
exports.getMyBookingsAndRequests = async (req, res) => {
  try {
    // Get user ID from the access token middleware
    const userId = req.user.id;
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }

    // Fetch all confirmed bookings
    const bookings = await Booking.find({ user: userId, isDeleted: false })
      .populate("venue", "name location")
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price")
      .populate("additional_services", "name description price")
      .sort({ "event_details.date": -1 });

    // Fetch all pending requests (with status 'Pending')
    const requests = await Request.find({
      user: userId,
      isDeleted: false,
      status: "Pending" // Only show requests that are still pending
    })
      .populate("venue", "name location")
      .populate("hall", "name capacity")
      .populate("requested_foods", "name price")
      .populate("additional_services", "name description price")
      .sort({ "event_details.date": -1 });

    console.log("Requests found:", requests);
    console.log("Fetching requests:", requests); // Debugging log
    console.log("Fetching bookings:", bookings); // Debugging log

    // Process requests: Remove those that have a booking
    const filteredRequests = requests.filter((reqItem) => {
      const isBooked = bookings.some(
        (booking) =>
          booking.venue._id.toString() === reqItem.venue._id.toString() &&
          booking.hall._id.toString() === reqItem.hall._id.toString() &&
          new Date(booking.event_details.date).getTime() === new Date(reqItem.event_details.date).getTime()
      );

      if (isBooked) {
        reqItem.statusMessage = "A booking already exists for this request";
      }

      return !isBooked; // Only keep requests that don't have bookings
    });

    // Add a message if no bookings exist
    if (bookings.length === 0) {
      return res.status(200).json({
        message: "Venue is not booked yet",
        requests: filteredRequests,
        bookings: [],
      });
    }

    res.status(200).json({
      message: "Bookings and requests retrieved successfully",
      requests: filteredRequests,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings and requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




