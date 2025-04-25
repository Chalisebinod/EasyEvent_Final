const mongoose = require("mongoose");

const bookingRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true },

  event_details: {
    event_type: { type: String, required: true },
    date: { type: Date, required: true },
    guest_count: { type: Number, required: true },
  },

  selected_foods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  booking_statius: { type: Boolean, default: false },
  // New field to store extra food requests from the frontend
  requested_foods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],

  additional_services: [
    {
      name: { type: String, required: false },
      description: { type: String, default: "" },
      price: { type: Number, default: 0 }
    },
  ],

  pricing: {
    original_per_plate_price: { type: Number, required: true },
    user_offered_per_plate_price: { type: Number, required: true },
    final_per_plate_price: { type: Number, required: true },
    food_cost: { type: Number, required: true }, // final_per_plate_price * guest_count
    additional_services_cost: { type: Number, default: 0 },
    total_cost: { type: Number, required: true },
    
    // Optional fields for request
    discount_amount: { type: Number, default: 0 },
    discount_reason: { type: String },
    amount_paid: { type: Number, default: 0 },
    balance_amount: { type: Number }
  },

  cancellation_policy: {
    cancel_before_days: { type: Number },
    cancellation_fee: { type: Number, default: 0 },
  },

  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
    default: "Pending",
  },
  reason: { type: String, default: "no status has been added" },
  payment_status: {
    type: String,
    enum: ["Unpaid", "Partially Paid", "Paid"],
    default: "Unpaid",
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware to auto-update `updated_at` and calculate pricing fields
bookingRequestSchema.pre("save", function (next) {
  this.updated_at = Date.now();

  // Calculate food cost and total cost if necessary fields are present
  if (this.pricing.final_per_plate_price && this.event_details.guest_count) {
    // Calculate food cost
    this.pricing.food_cost = this.pricing.final_per_plate_price * this.event_details.guest_count;
    
    // Calculate total cost (food cost + additional services cost - discounts)
    this.pricing.total_cost = this.pricing.food_cost + 
                             (this.pricing.additional_services_cost || 0) - 
                             (this.pricing.discount_amount || 0);
    
    // Calculate balance amount
    if (typeof this.pricing.amount_paid === 'number') {
      this.pricing.balance_amount = this.pricing.total_cost - this.pricing.amount_paid;
    }
  }

  next();
});

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
