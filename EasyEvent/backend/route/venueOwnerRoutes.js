const express = require("express");
const upload = require("../controller/fileController");
// Middleware to protect routes
const {
  checkAuthentication,
  checkIsVenueOwner,
} = require("../middleware/middleware");
const {
  checkKycStatus,
  getVenueOwnerProfile,
  updateVenueOwnerProfile,
  changeVenueOwnerPassword,
  getVenueOwnerStats,
} = require("../controller/venueOwnerController");
const { updateBookingStatus } = require("../controller/bookingController");

const router = express.Router();

// // Get all venues owned by the logged-in venue owner
// router.get("/venues", verifyToken, getVenueDetails);

// // Create a new venue
// router.post("/venues", verifyToken, createVenue);

// // Update an existing venue
// router.put("/venues/:venueId", verifyToken, updateVenue);

// // Delete a venue
// router.delete("/venues/:venueId", verifyToken, deleteVenue);


router.post(
  "/stats",
  checkAuthentication,
  checkIsVenueOwner,
  getVenueOwnerStats)

router.get(
  "/check-kyc-status",
  checkAuthentication,
  checkIsVenueOwner,
  checkKycStatus
);
// Route for getting Venue Owner profile
router.get(
  "/venueOwner/profile",
  checkAuthentication,
  checkIsVenueOwner,
  getVenueOwnerProfile
);

// Route for updating Venue Owner profile
router.put(
  "/profile",
  checkAuthentication,
  checkIsVenueOwner,upload.single("profile_image"),
  updateVenueOwnerProfile
);

// Route for changing Venue Owner password
router.put(
  "/change-password",
  checkAuthentication,
  checkIsVenueOwner,
  changeVenueOwnerPassword
);
router.patch("/updateStatus",checkAuthentication , updateBookingStatus);
module.exports = router;
