const express = require("express");
const { checkAuthentication } = require("../middleware/middleware");
const { getUnblockedVenues } = require("../controller/adminController");
const {
  createVenue,
  editVenue,
  deleteVenue,
  getAllVenuesForUser,
  getAllVenuesForShowcase,
  getVenueProfile,
  getVenueById,
} = require("../controller/venueController");
const upload = require("../controller/fileController");

const router = express.Router();

// Create a new venue (Only accessible to authenticated venue owners)
router.post("/venue/create", checkAuthentication, createVenue);

// Edit an existing venue (Only the owner can edit)
router.patch(
  "/venue/:venueId",
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  checkAuthentication,
  editVenue
);

// Delete a venue (Only the owner can delete)
router.delete("/delete/:venueId", checkAuthentication, deleteVenue);
router.get("/venue-profile", checkAuthentication, getVenueProfile);

// Get all venues for the authenticated user (Only accessible to authenticated venue owners)
router.get("/venues/user", checkAuthentication, getAllVenuesForUser);

// Add this route to fetch unblocked venues
router.get("/venues/unblocked", getUnblockedVenues);

// Get all venues for public showcase
router.get("/venues", getAllVenuesForShowcase);

// Get a specific venue by ID
router.get("/venues/:id", getVenueById);

module.exports = router;