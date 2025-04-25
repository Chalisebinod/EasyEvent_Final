const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact_number: { type: String, default: null },
  profile_image: { type: String, default: null },
  role: { type: String, default: "user" },
  is_blocked: { type: Boolean, default: false },
  block_reason: { type: String, default: null }, 
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue", // Allows users to save favorite venues
    },
  ],
  reviews: [
    {
      venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue" }, // Venue being reviewed
      comment: { type: String, required: true },
      rating: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  bookings: [
    {
      venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue" },
      date: { type: Date, required: true },
      status: { type: String, default: "Pending" }, // Pending, Confirmed, Cancelled
    },
  ],
  status: { type: String, default: "Active" },
  date_created: { type: Date, default: Date.now },
  last_login: { type: Date, default: null },

  // ✅ New KYC Images Section
  kyc: {
    profile: { type: String, default: null },
    citizenship: { type: String, default: null },
    citizenshipBack: { type: String, default: null }, // Added citizenship back image
    pan: { type: String, default: null },
    map: { type: String, default: null },
    signature: { type: String, default: null },
  },

});

module.exports = mongoose.model("User", userSchema);
