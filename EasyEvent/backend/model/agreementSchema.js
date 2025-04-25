const mongoose = require("mongoose");

// AgreementTemplate Schema: Stores default rules or provisions which the owner can select.
const agreementTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ["terms", "rules", "cancellation"] 
  },
  content: { type: String, required: true }, // Predefined HTML content
  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Venue",
    required: true 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

// Agreement Schema: Stores a complete agreement document for a booking.
const agreementSchema = new mongoose.Schema({
  // Owner details
  ownerName: { type: String, required: true },
  ownerAddress: { type: String, required: true },
  ownerContact: { type: String, required: true },

  // Consumer details
  consumerName: { type: String, required: true },
  consumerAddress: { type: String, required: true },
  consumerContact: { type: String, required: true },

  // Booking/Agreement details
  venueAddress: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventDuration: { type: String, required: true },
  eventVenue: { type: String, required: true },
  totalPeople: { type: Number, required: true },
  pricePerPlate: { type: Number, required: true },
  deposit: { type: Number, required: true },
  depositDueDate: { type: Date, required: true },
  balance: { type: Number, required: true },
  balanceDueDate: { type: Date, required: true },

  // Agreement text parts (referencing templates)
  termsTemplate: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AgreementTemplate",
    required: true
  },
  rulesTemplate: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AgreementTemplate",
    required: true
  },
  cancellationTemplate: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AgreementTemplate",
    required: true
  },

  // Custom modifications to template content if any
  customTerms: { type: String },
  customRules: { type: String },
  customCancellation: { type: String },

  // Signature data
  signatureData: { type: String },

  // Reference to the booking document (stores the booking ID)
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking",  // This references the Booking model
    required: true 
  },

  status: {
    type: String,
    enum: ["Draft", "Pending", "Signed"],
    default: "Draft"
  }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = {
  Agreement: mongoose.model("Agreement", agreementSchema),
  AgreementTemplate: mongoose.model("AgreementTemplate", agreementTemplateSchema)
};
