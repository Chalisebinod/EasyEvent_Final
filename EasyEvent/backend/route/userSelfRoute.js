const express = require("express");
const { checkAuthentication } = require("../middleware/middleware");
const {
  getUserProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
  updateUserProfile,
} = require("../controller/userSelfController");
const upload = require("../controller/fileController");

const router = express.Router();

router.get("/profile", checkAuthentication, getUserProfile);
router.put("/profile/update", checkAuthentication, upload.single("profile_image"), updateUserProfile);
router.put("/change-password", checkAuthentication, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOtp);
module.exports = router;
