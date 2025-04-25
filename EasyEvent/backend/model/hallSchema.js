const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema({
  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Venue", 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  capacity: { 
    type: Number, 
    required: true 
  },
  basePricePerPlate: { 
    type: Number, 
    required: true 
  },
  // Array of Food IDs that are included in the base price.
  includedFood: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Food"
  }],
  features: [{ 
    type: String 
  }],
  images: [{ 
    type: String 
  }],
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  bookedDates: [{ 
    type: Date 
  }],
});

module.exports = mongoose.model("Hall", hallSchema);
