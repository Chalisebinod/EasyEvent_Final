const Notification = require("../model/notifications"); 

// Controller function to fetch notifications for a VenueOwner
const getVenueOwnerNotifications = async (req, res) => {
  try {
    // Extract the venue owner's ID from the request (assumed to be in req.user.id, depending on your authentication method)
    const venueOwnerId = req.user.id;

    // Fetch all notifications where the userId matches the venue owner's ID and the role is 'VenueOwner'
    const notifications = await Notification.find({
      userId: venueOwnerId,
      role: "VenueOwner",
    }).sort({ createdAt: -1 }); // Sort notifications by creation date (most recent first)

    if (!notifications) {
      return res
        .status(404)
        .json({ message: "No notifications found for this venue owner." });
    }

    // Return the notifications
    res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error while fetching notifications." });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id; // Get user from auth middleware
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getVenueOwnerNotifications,
  getUnreadCount,
  markRead,
};
