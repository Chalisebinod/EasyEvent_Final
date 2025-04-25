const express = require("express");
const {
  checkAuthentication,
  checkCanSubmitReview,
} = require("../middleware/middleware");
const { submitReview, getVenueReviews } = require("../controller/reviewController");

const router = express.Router();

// Route to submit a review
router.post("/submit", checkAuthentication, checkCanSubmitReview, submitReview);
router.post("/getReview", checkAuthentication, getVenueReviews);


module.exports = router;
