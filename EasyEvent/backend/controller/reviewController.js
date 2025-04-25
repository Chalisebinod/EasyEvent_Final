const Review = require("../model/Review.js");
const User = require("../model/user.js");
const nodemailer = require("nodemailer");
const Booking = require("../model/bookingSchema.js");
const Venue = require("../model/venue.js");

// Submit a Review
const submitReview = async (req, res) => {
  try {
    const { bookingId, rating, review } = req.body;
    const userId = req.user.id;

    // Check if the booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure the user who booked is the one submitting the review
    if (booking.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to review this booking" });
    }

    // Get venueId from the booking
    const venueId = booking.venue;

    // Find the venue to get the ownerId
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    const venueOwnerId = venue.owner;

    // Check if the user has already reviewed this booking
    const existingReview = await Review.findOne({ bookingId, userId });
    if (existingReview) {
      return res
        .status(400)
        .json({
          message: "You have already submitted a review for this booking",
        });
    }

    // Save review
    const newReview = new Review({
      bookingId,
      venueId,
      venueOwnerId,
      userId,
      rating,
      review,
    });
    await newReview.save();

    // Update the average rating for the venue
    await Review.updateAverageRating(venueId);

    res
      .status(201)
      .json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get All Reviews for a Venue Owner
const getVenueReviews = async (req, res) => {
  try {
    const { venueId } = req.body;
    if (!venueId) {
      return res.status(400).json({ message: "venueId is required" });
    }

    // Find reviews for the given venueId and populate the user's name and profile_image fields
    const reviews = await Review.find({ venueId })
      .populate("userId", "name profile_image")
      .sort({ createdAt: -1 });

    // Map the reviews to the desired output format
    const formattedReviews = reviews.map((r) => ({
      username: r.userId.name,
      profileImage: r.userId.profile_image,
      review: r.review,
      rating: r.rating,
      reviewDate: r.createdAt,
    }));

    res.json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Send Email to User with Review Link
const sendReviewLink = async (req, res) => {
  try {
    const { userEmail, venueOwnerId } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const reviewLink = `http://localhost:8000/review?venueOwnerId=${venueOwnerId}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Provide Your Review for the Venue",
      text: `Please click on the link to provide your rating & review: ${reviewLink}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Review link sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending email", error });
  }
};

module.exports = {
  submitReview,
  getVenueReviews,
  sendReviewLink,
};
