// routes/hallRoutes.js
const express = require("express");
const router = express.Router();
const hallController = require("../controller/hallController");
const upload = require("../controller/fileController"); // Multer middleware
const { checkAuthentication } = require("../middleware/middleware");


// Create a new hall (allows multiple images; adjust the field name 'images' as needed)
router.post("/",checkAuthentication, upload.array("images", 5), hallController.addHall);

// Update hall details (allows updating images as well)
router.patch(
  "/:id",
  checkAuthentication,
  upload.array("images", 5),
  hallController.editHall
);

// Delete a hall
router.delete("/:id", checkAuthentication, hallController.deleteHall);

// Get halls with blocked dates separated
router.get(
  "/with-blocked-dates",
  checkAuthentication,
  hallController.getHallsWithBlockedDates
);

// Get halls profile for the venue owner
router.get("/profile", checkAuthentication, hallController.getHallsProfile);
router.get("/:venueId", checkAuthentication, hallController.getHallsByVenue);
router.get("book/:hallId ", checkAuthentication, hallController.bookHall);
router.get("update/:hallId ", checkAuthentication, hallController.updateHallAvailability);




module.exports = router;
