const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true },

  event_details: {
    event_type: { type: String, required: true },
    date: { type: Date, required: true },
    guest_count: { type: Number, required: true },
  },

  selected_foods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],

  // New field to store extra food requests from the frontend
  requested_foods: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  booking_statius: { type: Boolean, default: false },


  additional_services: [
    {
      name: { type: String, required: false },
      description: { type: String, default: "" },
      price: { type: Number, default: 0 }
    },
  ],

  pricing: {
    // Per plate pricing details
    original_per_plate_price: { type: Number, required: true },
    user_offered_per_plate_price: { type: Number, required: true },
    final_per_plate_price: { type: Number, required: true },
    
    // Cost breakdown
    food_cost: { type: Number, required: true }, // final_per_plate_price * guest_count
    additional_services_cost: { type: Number, default: 0 },
    total_cost: { type: Number, required: true },
    
    // Discounts if any
    discount_amount: { type: Number, default: 0 },
    discount_reason: { type: String },

    // Payment tracking
    amount_paid: { type: Number, default: 0 },
    balance_amount: { type: Number },
    last_payment_date: { type: Date }
  },

  cancellation_policy: {
    cancel_before_days: { type: Number },
    cancellation_fee: { type: Number, default: 0 },
  },

  // Extended status to include additional states like Running and Completed.
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Running", "Completed"],
    default: "Pending",
  },

  // Owner notes and extended information
  owner_notes: { type: String, default: "" },

  // Soft delete flag – not actually removing documents from the DB.
  isDeleted: { type: Boolean, default: false },

  // Booking period to easily sort (can be computed based on event date, but stored here for convenience)
  booking_period: {
    type: String,
    enum: ["Past", "Current", "Future"],
    default: "Future",
  },

  reason: { type: String, default: "no status has been added" },

  payment_status: {
    type: String,
    enum: ["Unpaid", "Partially Paid", "Paid", "Refunded"],
    default: "Unpaid",
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware to update updated_at before saving
bookingSchema.pre("save", function (next) {
  this.updated_at = Date.now();

  // Calculate and update pricing fields
  if (this.isModified('event_details.guest_count') || 
      this.isModified('pricing.final_per_plate_price') || 
      this.isModified('additional_services')) {
    
    // Calculate food cost
    this.pricing.food_cost = this.pricing.final_per_plate_price * this.event_details.guest_count;
    
    // Calculate additional services cost
    this.pricing.additional_services_cost = this.additional_services.reduce(
      (sum, service) => sum + (service.price || 0), 
      0
    );
    
    // Calculate total cost
    this.pricing.total_cost = this.pricing.food_cost + 
                             this.pricing.additional_services_cost - 
                             this.pricing.discount_amount;
    
    // Calculate balance amount
    this.pricing.balance_amount = this.pricing.total_cost - this.pricing.amount_paid;
  }

  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
