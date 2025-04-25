const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue",
    required: true,
  },
  venueOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  rating: { type: Number, required: true, min: 0, max: 10 },
  averageRating: { type: Number, default: 0 }, // This will be calculated later
  review: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Middleware to update average rating after each review
reviewSchema.statics.updateAverageRating = async function (venueId) {
  const result = await this.aggregate([
    { $match: { venueId: new mongoose.Types.ObjectId(venueId) } },
    { $group: { _id: "$venueId", avgRating: { $avg: "$rating" } } },
  ]);

  const avgRating = result.length > 0 ? result[0].avgRating : 0;

  // Update all reviews for this venue with the new average rating
  await this.updateMany({ venueId }, { $set: { averageRating: avgRating } });
};

module.exports = mongoose.model("Review", reviewSchema);
