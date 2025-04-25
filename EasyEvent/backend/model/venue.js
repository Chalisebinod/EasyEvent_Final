const mongoose = require("mongoose");

// Define the schema
const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VenueOwner",
    required: true,
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
  },
  profile_image: { type: String },
  images: [{ type: String }],
  description: { type: String, required: true },
  is_blocked: { type: Boolean, default: false, required: true },
block_reason: { type: String, default: null }, 

  event_pricing: [
    {
      event_type: { type: String, required: true },
      pricePerPlate: { type: Number, required: true },
      description: { type: String },
      services_included: [{ type: String }],
      hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall" },
    },
  ],
  additional_services: [
    {
      name: { type: String, required: true },
      description: { type: String, default: "" },
    },
  ],
  contact_details: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    whatsapp: { type: String },
    social_media: {
      facebook: { type: String },
      instagram: { type: String },
      website: { type: String },
    },
  },
  payment_policy: {
    advance_percentage: { type: Number, default: 50 },
    security_deposit: { type: Number, default: 0 },
    refund_policy: { type: String, default: "No Refund" },
    cancellation_penalty: {
      type: String,
      default: "10% deduction if canceled within a week",
    },
  },
  verification_status: { type: String, default: "Unverified" },
  reported_count: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  date_created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: { type: String, required: true },
      rating: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
});

// Define the model only if it hasn't been defined yet
const Venue = mongoose.models.Venue || mongoose.model("Venue", venueSchema);

module.exports = Venue;
