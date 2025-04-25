const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../middleware/middleware");
const { deleteFoodPlan, updateFoodPlan, getFoodPlans, addFoodPlan, deleteFood, updateFood, getFoodsByVenue, addFood, createFoodCategory, getFoodCategories, deleteFoodCategory } = require("../controller/foodController");

// ------------------ Food Routes ------------------
// Create a new Food item
router.post("/food/add", checkAuthentication, addFood);
// Get all Food items for a specific venue
router.get("/food/venue/:venueId", checkAuthentication, getFoodsByVenue);
// Update an existing Food item
router.patch("/food/:id", checkAuthentication, updateFood);
// Delete a Food item
router.delete("/food/:id", checkAuthentication, deleteFood);

// ------------------ Food Plan Routes ------------------
// Create a new Food Plan
router.post("/foodplan/add", checkAuthentication, addFoodPlan);
// Get Food Plans (optionally filtered by venue or booking via query params)
router.get("/foodplan", checkAuthentication, getFoodPlans);
// Update an existing Food Plan
router.patch("/foodplan/:id", checkAuthentication, updateFoodPlan);
// Delete a Food Plan
router.delete("/foodplan/:id", checkAuthentication, deleteFoodPlan);



// food category controller 
// Create a new Food Category
router.post("/foodCategory/create", checkAuthentication, createFoodCategory);

// Get all Food Categories for a given venue (pass venueId as route parameter)
router.get("/foodCategory/:venueId", checkAuthentication, getFoodCategories);

// Delete a Food Category by its ID
router.delete("/foodCategory/:id", checkAuthentication, deleteFoodCategory);
module.exports = router;
