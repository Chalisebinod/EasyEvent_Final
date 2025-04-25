const mongoose = require("mongoose");

const venueOwnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact_number: { type: String, required: true },
    profile_image: { type: String, default: null },
    role: { type: String, default: "venueOwner" },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["verified", "pending", "rejected"], 
      default: "pending", // Default status is 'pending'
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      default: null, // Ensure it is null initially, instead of an empty string
    },
    
    reported_count: { type: Number, default: 0 }, // Tracks reports against the owner
    is_blocked: { type: Boolean, default: false }, 
    block_reason: { type: String, default: null }, 
    last_login: { type: Date, default: null },

    // Add fields for document uploads
    citizenship_front: { type: String, default: null }, // URL or path for the front of the citizenship document
    citizenship_back: { type: String, default: null }, // URL or path for the back of the citizenship document
    pan_card_vat: { type: String, default: null }, // URL or path for the PAN/VAT document
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("VenueOwner", venueOwnerSchema);
