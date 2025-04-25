const mongoose = require("mongoose");

const foodCategorySchema = new mongoose.Schema({
  venue: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Venue", 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  mealType: { 
    type: String, 
    required: true, 
    enum: ["starter", "launch", "dinner"] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model("FoodCategory", foodCategorySchema);
