const mongoose = require("mongoose");

// Define the Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "role", // Dynamic reference based on the user's role
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["User", "VenueOwner"],
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Notification model
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
