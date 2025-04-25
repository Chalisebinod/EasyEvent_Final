const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // amount represents the last partial payment (if needed)
  amount: {
    type: Number,
    required: true,
  },
  // cumulative_paid tracks the total amount received across partial payments
  cumulative_paid: {
    type: Number,
    default: 0,
  },
  expected_amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    enum: ["Khalti"],
    default: "Khalti",
  },
  transaction_id: {
    type: String,
    unique: true,
    sparse: true,
  },
  payment_status: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Refunded", "Partially Paid"],
    default: "Pending",
  },
  payment_type: {
    type: String,
    enum: ["Advance", "Full"],
    required: false,
  },
  due_date: {
    type: Date,
    required: function () {
      return this.payment_type === "Advance";
    },
  },
  payment_instructions: {
    type: String,
    required: function () {
      return this.payment_type === "Advance";
    },
  },
  refund_amount: {
    type: Number,
    default: 0,
  },
  paid_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to auto-update `updated_at`
paymentSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
