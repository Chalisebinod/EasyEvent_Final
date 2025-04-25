// Routes for adminController
const express = require("express");
const {
  getAllUsers,
  getAllVenueOwners,
  blockUser,
  blockVenueOwner,
  getAllAdmins,
  getVenueOwner,
  venueForAdmmin,
  blockVenue,
  getDashboardInsights,

} = require("../controller/adminController");
const {
  checkAuthentication,
  checkIsAdmin,
} = require("../middleware/middleware");
const router = express.Router();

router.get("/admins", checkAuthentication, checkIsAdmin, getAllAdmins);

router.get("/users", checkAuthentication, checkIsAdmin, getAllUsers);
router.get("/stats", checkAuthentication, checkIsAdmin, getDashboardInsights);


router.get("/venueOwnerProfile/:userId", checkAuthentication, checkIsAdmin, getVenueOwner);
router.get(
  "/venue-owners",
  checkAuthentication,
  checkIsAdmin,
  getAllVenueOwners
);

// New route for fetching all venues
router.get("/admin/venues", checkAuthentication, checkIsAdmin, venueForAdmmin);


router.put(
  "/users/block/:userId",
  checkAuthentication,
  checkIsAdmin,
  blockUser
);
router.put(
  "/venueOwner/block/:userId",
  checkAuthentication,
  checkIsAdmin,
  blockVenueOwner
);
router.put(
  "/venue/block/:venueId",
  checkAuthentication,
  checkIsAdmin,
  blockVenue 
);

module.exports = router;
