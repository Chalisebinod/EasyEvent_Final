const express = require("express");
const router = express.Router();
const { checkAuthentication, checkIsVenueOwner } = require("../middleware/middleware");
const upload = require("../controller/fileController");
const { createBooking, updateBooking, cancelBooking, deleteBooking, getRequestsByVenue, getBookingByRequestId, updateRequestStatus, getApprovedBookings, getApprovedBookingDetails, createOwnerBooking, setPaymentDetails, uploadOwnerSignature, getPaymentDetails } = require("../controller/venueBookingController");
const { createTemplate, getTemplatesByVenue, updateTemplate, deleteTemplate, setDefaultTemplate, generateAgreement } = require("../controller/agreementController");


// Booking Routes
router.post("/create", checkAuthentication, createBooking);
router.put("/edit/:bookingId", checkAuthentication, updateBooking);
router.put("/cancel/:bookingId", checkAuthentication, cancelBooking);
router.delete("/delete/:bookingId", checkAuthentication, deleteBooking);

// Venue Owner Routes
router.get("/requests/venue/:venueId", checkAuthentication, checkIsVenueOwner, getRequestsByVenue); 
router.get("/requests/profile/:requestId", checkAuthentication, checkIsVenueOwner, getBookingByRequestId);
router.patch("/requests/:requestId", checkAuthentication, checkIsVenueOwner, updateRequestStatus);

// Approved Bookings & Owner Bookings
router.get("/approved/:venueId", checkAuthentication, checkIsVenueOwner, getApprovedBookings);
router.get("/approved/details/:bookingId", checkAuthentication, checkIsVenueOwner, getApprovedBookingDetails);
router.post("/owner-booking", checkAuthentication, checkIsVenueOwner, createOwnerBooking);

router.post('/payment-details/:bookingId', checkAuthentication, setPaymentDetails);

// Agreement Template Routes
router.post('/templates', checkAuthentication, checkIsVenueOwner, createTemplate);
router.get('/templates/:venueId', checkAuthentication, checkIsVenueOwner, getTemplatesByVenue);
router.put('/templates/:templateId', checkAuthentication, checkIsVenueOwner, updateTemplate);
router.delete('/templates/:templateId', checkAuthentication, checkIsVenueOwner, deleteTemplate);
router.put('/templates/:templateId/set-default', checkAuthentication, checkIsVenueOwner, setDefaultTemplate);

// Agreement Generation Route
router.post('/generate-agreement/:bookingId', checkAuthentication, checkIsVenueOwner, generateAgreement);
router.get("/payment-details/:bookingId", checkAuthentication, getPaymentDetails);
// Route for uploading owner's signature
router.put(
  '/owner-signature/:bookingId',
  upload.single('signature'), // Accept one image file with the field name "signature"
  checkAuthentication,
  uploadOwnerSignature
);

module.exports = router;
