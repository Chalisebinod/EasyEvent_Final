const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VenueOwner",
    required: true,
    unique: true, // Enforce one KYC per owner at the database level
  },

  // Name, phone, and location will be derived from the venue owner
  phone: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },

  profile: { type: String, default: "" },
  // Change venueImages from a string to an array of strings
  venueImages: { type: [String], default: [] },
  citizenshipFront: { type: String, default: "" },
  citizenshipBack: { type: String, default: "" },
  pan: { type: String, default: "" },
  map: { type: String, default: "" },
  signature: { type: String, default: "" },

  venueName: { type: String, required: true }, // Name of the venue
  venueAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
  },

  verificationStatus: { type: String, default: "pending" }, // Pending, Verified, Rejected
  rejectMsg: { type: String, default: null },
});

const Kyc = mongoose.model("Kyc", kycSchema);

module.exports = Kyc;
