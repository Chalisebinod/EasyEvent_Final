const Food = require("../model/foodSchema");
const Venue = require("../model/venue");
const FoodPlan = require("../model/foodPlanSchema");
// food category:
const FoodCategory = require("../model/FoodCategorySchema");

// Create a new Food item
exports.addFood = async (req, res) => {
  try {
    const { venue, mealType, category, name, price, description, custom_options } = req.body;
    // Validate required fields
    if (!venue || !mealType || !category || !name || price === undefined) {
      return res.status(400).json({ message: "Required fields missing." });
    }
    // Check if venue exists
    const venueExists = await Venue.findById(venue);
    if (!venueExists) {
      return res.status(404).json({ message: "Venue not found" });
    }
    // Create the Food document
    const food = new Food({
      venue,
      mealType,
      category,
      name,
      price,
      description,
      custom_options:
        Array.isArray(custom_options)
          ? custom_options
          : (typeof custom_options === "string"
            ? custom_options.split(",").map((s) => s.trim())
            : []),
    });
    await food.save();
    return res.status(201).json({ message: "Food added successfully", food });
  } catch (error) {
    console.error("Error adding food:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all Food items for a given venue
exports.getFoodsByVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const foods = await Food.find({ venue: venueId });
    if (!foods || foods.length === 0) {
      return res.status(404).json({ message: "No foods found for this venue" });
    }
    return res.status(200).json({ foods });
  } catch (error) {
    console.error("Error fetching foods:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an existing Food item
exports.updateFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const updates = req.body;
    // Convert custom_options to array if it is provided as a string
    if (updates.custom_options && typeof updates.custom_options === "string") {
      updates.custom_options = updates.custom_options.split(",").map((s) => s.trim());
    }
    const updatedFood = await Food.findByIdAndUpdate(foodId, updates, { new: true });
    if (!updatedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    return res.status(200).json({ message: "Food updated successfully", food: updatedFood });
  } catch (error) {
    console.error("Error updating food:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a Food item
exports.deleteFood = async (req, res) => {
  try {
    const foodId = req.params.id;
    const deletedFood = await Food.findByIdAndDelete(foodId);
    if (!deletedFood) {
      return res.status(404).json({ message: "Food not found" });
    }
    return res.status(200).json({ message: "Food deleted successfully" });
  } catch (error) {
    console.error("Error deleting food:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// food plan




// Create a new Food Plan
exports.addFoodPlan = async (req, res) => {
  try {
    const { booking, venue, mealType, selectedFoods, additionalCost } = req.body;
    // Validate required fields (selectedFoods must be an array)
    if (!booking || !venue || !mealType || !selectedFoods || !Array.isArray(selectedFoods)) {
      return res.status(400).json({ message: "Required fields missing." });
    }
    const foodPlan = new FoodPlan({
      booking,
      venue,
      mealType,
      selectedFoods,
      additionalCost: additionalCost || 0,
    });
    await foodPlan.save();
    return res.status(201).json({ message: "Food plan added successfully", foodPlan });
  } catch (error) {
    console.error("Error adding food plan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Food Plans; optionally filter by venue or booking
exports.getFoodPlans = async (req, res) => {
  try {
    const { venueId, bookingId } = req.query;
    const filter = {};
    if (venueId) filter.venue = venueId;
    if (bookingId) filter.booking = bookingId;
    const foodPlans = await FoodPlan.find(filter).populate("selectedFoods.food");
    if (!foodPlans || foodPlans.length === 0) {
      return res.status(404).json({ message: "No food plans found." });
    }
    return res.status(200).json({ foodPlans });
  } catch (error) {
    console.error("Error fetching food plans:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an existing Food Plan
exports.updateFoodPlan = async (req, res) => {
  try {
    const foodPlanId = req.params.id;
    const updates = req.body;
    const updatedFoodPlan = await FoodPlan.findByIdAndUpdate(foodPlanId, updates, { new: true });
    if (!updatedFoodPlan) {
      return res.status(404).json({ message: "Food plan not found" });
    }
    return res.status(200).json({ message: "Food plan updated successfully", foodPlan: updatedFoodPlan });
  } catch (error) {
    console.error("Error updating food plan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a Food Plan
exports.deleteFoodPlan = async (req, res) => {
  try {
    const foodPlanId = req.params.id;
    const deletedFoodPlan = await FoodPlan.findByIdAndDelete(foodPlanId);
    if (!deletedFoodPlan) {
      return res.status(404).json({ message: "Food plan not found" });
    }
    return res.status(200).json({ message: "Food plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting food plan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};





// Create a new Food Category
exports.createFoodCategory = async (req, res) => {
  try {
    const { venue, name, mealType } = req.body;

    // Validate required fields
    if (!venue || !name || !mealType) {
      return res.status(400).json({ message: "Venue, name, and mealType are required." });
    }

    // Optionally verify that the venue exists
    const venueExists = await Venue.findById(venue);
    if (!venueExists) {
      return res.status(404).json({ message: "Venue not found." });
    }

    const newCategory = new FoodCategory({
      venue,
      name,
      mealType,
    });
    await newCategory.save();
    res.status(201).json({ message: "Food category created successfully", category: newCategory });
  } catch (error) {
    console.error("Error creating food category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all Food Categories (optionally filtered by venue)
exports.getFoodCategories = async (req, res) => {
  try {
    const { venueId } = req.params;
    const filter = venueId ? { venue: venueId } : {};
    const categories = await FoodCategory.find(filter);
    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No food categories found." });
    }
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching food categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a Food Category by its ID
exports.deleteFoodCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const deletedCategory = await FoodCategory.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Food category not found." });
    }
    res.status(200).json({ message: "Food category deleted successfully" });
  } catch (error) {
    console.error("Error deleting food category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
