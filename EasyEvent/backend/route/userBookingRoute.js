const express = require("express");
const {
  bookEvent,
  getBookingDetails,
  deleteBooking,
} = require("../controller/userBookingController");
const { checkAuthentication } = require("../middleware/middleware");
const {getMyBookingsAndRequests } = require("../controller/bookingController");

const router = express.Router();

// User routes
router.post("/book", bookEvent);
router.get("/booking/:bookingId", checkAuthentication, getBookingDetails);
router.delete("/booking/:bookingId", deleteBooking);
router.get("/myBooking",checkAuthentication, getMyBookingsAndRequests);


module.exports = router;
