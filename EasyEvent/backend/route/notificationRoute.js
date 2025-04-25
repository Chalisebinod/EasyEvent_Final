const express = require("express");
const router = express.Router();
const {
  getVenueOwnerNotifications,
  getUnreadCount,
  markRead,
} = require("../controller/notificationController");
const { checkAuthentication } = require("../middleware/middleware");

// Route to get venue owner notifications
router.get(
  "/getVenueOwnerNotification",
  checkAuthentication,
  getVenueOwnerNotifications
);
router.get("/getUnreads", checkAuthentication, getUnreadCount);
router.put("/markRead/:id", checkAuthentication, markRead);

module.exports = router;
