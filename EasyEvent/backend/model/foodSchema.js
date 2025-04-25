// models/Food.js
const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Venue", 
    required: true 
  },
  mealType: { 
    type: String, 
    required: true, 
    enum: ["starter", "launch", "dinner"] 
  },
  // Use "category" if you want further sub-categorization like Cold Drinks, Pasta etc.
  category: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String 
  },
  custom_options: [{ 
    type: String 
  }],
});

module.exports = mongoose.model("Food", foodSchema);
