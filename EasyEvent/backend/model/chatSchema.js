const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    // Optional: you could track when the receiver read the message
    readAt: { 
      type: Date 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
