// models/FoodPlan.js
const mongoose = require("mongoose");

const foodPlanSchema = new mongoose.Schema({
  booking: { // reference to the event or booking document
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Venue", 
    required: true 
  },
  // This could be "starter", "launch", "dinner" or you might support multiple meal types per plan
  mealType: { 
    type: String, 
    required: true, 
    enum: ["starter", "launch", "dinner"]
  },
  // Selected food items (each from the Food catalog)
  selectedFoods: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
    // Optionally you can store quantity or extra instructions here
    quantity: { type: Number, default: 1 }
  }],
  // Calculated additional cost for the selected foods (for all people or per plate as per your business rule)
  additionalCost: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("FoodPlan", foodPlanSchema);
