const express = require("express");
const {
  updateKYC,
  upload,
  verifyKYC,
  getAllKYC,
  getProfileKyc,
  getVenueOwnerProfile,
  getVenueOwnerProfileKyc,
} = require("../controller/kycController");
const {
  checkAuthentication,
  checkIsVenueOwner,
  checkIsAdmin,
} = require("../middleware/middleware");

const router = express.Router();

// API Route to update KYC data
router.post("/post", checkAuthentication, checkIsVenueOwner, updateKYC);
router.put("/verify", checkAuthentication, checkIsAdmin, verifyKYC);
router.get("/all", checkAuthentication, checkIsAdmin, getAllKYC);
router.get("/profile-kyc", checkAuthentication, checkIsVenueOwner, getVenueOwnerProfile);
router.get("/venue-kycs/", checkAuthentication, checkIsVenueOwner, getVenueOwnerProfileKyc);


router.get(
  "/profile/:kycId",
  checkAuthentication,
  checkIsAdmin,
  getProfileKyc
);

module.exports = router;
