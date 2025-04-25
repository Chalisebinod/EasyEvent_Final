const express = require("express");
const { checkAuthentication } = require("../middleware/middleware");
const {
  initiatePayment,
  verifyPayment,
  refundPayment,
  fetchReceivedAmount,
  getOwnerPayments,
} = require("../controller/paymentController");
const router = express.Router();
router.post("/initiate", checkAuthentication, initiatePayment);
router.post("/verify", checkAuthentication, verifyPayment);
router.post("/refund", checkAuthentication, refundPayment);

router.post("/get", checkAuthentication, fetchReceivedAmount);
// router.get("/get", checkAuthentication, fetchReceivedAmount);
router.get("/getpayments", checkAuthentication, getOwnerPayments);

module.exports = router;
