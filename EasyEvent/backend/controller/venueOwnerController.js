const VenueOwner = require("../model/venueOwner");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Kyc = require("../model/KYC");
const Venue = require("../model/venue");
const Booking = require("../model/bookingSchema");
const Payment = require("../model/payment");  
const Hall = require("../model/hallSchema");

// Check KYC Status
async function checkKycStatus(req, res) {
  try {
    // Get the venue owner ID from the authentication middleware
    const venueOwnerId = req.user.id;

    // (Optional) Verify the VenueOwner exists
    const venueOwner = await VenueOwner.findById(venueOwnerId);
    if (!venueOwner) {
      return res.status(404).json({ message: "Venue Owner not found" });
    }

    // Find the KYC record for this venue owner
    const kycRecord = await Kyc.findOne({ owner: venueOwnerId });
    if (!kycRecord) {
      return res.status(404).json({ message: "KYC record not found" });
    }

    // Determine if the KYC is verified.
    // Here we expect verificationStatus to be "approved" (or "verified" if you prefer)
    // and that both citizenshipFront and citizenshipBack files exist.
    const isKYCVerified =
      kycRecord.verificationStatus.toLowerCase() === "approved" &&
      kycRecord.citizenshipFront &&
      kycRecord.citizenshipBack;

    if (isKYCVerified) {
      return res.status(200).json({
        message: "KYC Verified",
        status: kycRecord.verificationStatus, // e.g., "approved"
      });
    } else {
      return res.status(200).json({
        message: "KYC Pending or Incomplete",
        status: kycRecord.verificationStatus, // e.g., "pending" or "rejected"
      });
    }
  } catch (error) {
    console.error("Error checking KYC status:", error.message);
    return res.status(500).json({ message: "Server error, try again later" });
  }
}


// Get Venue Owner Profile
async function getVenueOwnerProfile(req, res) {
  try {
    const venueOwnerId = req.user.id; // Venue Owner ID from authentication middleware

    // Fetch Venue Owner details excluding password
    const venueOwner = await VenueOwner.findById(venueOwnerId).select("-password");
    if (!venueOwner) {
      return res.status(404).json({ message: "Venue Owner not found" });
    }

    // Ensure venueOwnerId is an ObjectId
    const ownerObjectId = new mongoose.Types.ObjectId(venueOwnerId);

    // Find the venue associated with this owner
    const venue = await Venue.findOne({ owner: ownerObjectId });

    if (!venue) {
      console.log(`Venue not found for owner: ${venueOwnerId}`);
    }

    // Construct response with venue details
    const venueOwnerProfile = {
      ...venueOwner.toObject(), // Convert Mongoose document to plain object
      venueId: venue ? venue._id : null, // Attach venue ID if found
      venue: venue || null, // Optional: Include full venue details
    };

    res.status(200).json(venueOwnerProfile);
  } catch (error) {
    console.error("Error fetching venue owner profile:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update Venue Owner Profile
async function updateVenueOwnerProfile(req, res) {
  try {
    const venueOwnerId = req.user.id;
    const { name, contact_number, location } = req.body;

    // Check if a new profile image was uploaded
    let profile_image;
    if (req.file) {
      // Use the path or filename provided by multer (adjust according to your multer configuration)
      profile_image = req.file.path; 
    } else {
      // If no new file was uploaded, fall back to the existing value from req.body (if any)
      profile_image = req.body.profile_image;
    }

    const updatedVenueOwner = await VenueOwner.findByIdAndUpdate(
      venueOwnerId,
      { name, contact_number, location, profile_image },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedVenueOwner) {
      return res.status(404).json({ message: "Venue Owner not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      venueOwner: updatedVenueOwner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// Change Password for Venue Owner
async function changeVenueOwnerPassword(req, res) {
  try {
    const venueOwnerId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const venueOwner = await VenueOwner.findById(venueOwnerId);
    if (!venueOwner) {
      return res.status(404).json({ message: "Venue Owner not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, venueOwner.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    venueOwner.password = await bcrypt.hash(newPassword, salt);

    await venueOwner.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
async function getVenueOwnerStats(req, res) {
  try {
    // Get venueOwner id from the authentication middleware and venueId from the request body
    const venueOwnerId = req.user.id;
    const { venueId } = req.body;
    if (!venueId) {
      return res.status(400).json({ success: false, message: "Venue ID is required." });
    }

    // Verify that this venue belongs to the logged-in venue owner
    const venue = await Venue.findOne({ _id: venueId, owner: venueOwnerId });
    if (!venue) {
      return res.status(404).json({ success: false, message: "Venue not found for this owner." });
    }

    // Get all bookings for this venue
    const bookings = await Booking.find({ venue: venueId }).lean();
    const bookingCount = bookings.length;

    // Count total distinct users who booked this venue 
    const userIds = new Set(bookings.map((b) => b.user.toString()));
    const totalUsers = userIds.size;

    // Count total halls for this venue (assuming halls have a venue field)
    const hallCount = await Hall.countDocuments({ venue: venueId });

    // Get all payment records corresponding to these bookings
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({ booking: { $in: bookingIds } }).lean();

    let totalReceivedToday = 0;
    let totalRefundAmount = 0;
    let totalAmountToBeReceived = 0;

    // Define today's start and end timestamps
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    payments.forEach((payment) => {
      if (payment.created_at >= todayStart && payment.created_at <= todayEnd) {
        totalReceivedToday += payment.cumulative_paid;
      }
      totalRefundAmount += payment.refund_amount;
      totalAmountToBeReceived += (payment.expected_amount - payment.cumulative_paid);
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,             // distinct count of users who booked this venue
        bookingCount,           // total bookings for the venue
        hallCount,              // total halls available for the venue
        totalReceivedToday,     // total payment (cumulative) received today
        totalRefundAmount,      // total refunds processed on these payments
        totalAmountToBeReceived // sum of (expected_amount - cumulative_paid) across payments
      },
    });
  } catch (error) {
    console.error("Error in getVenueOwnerStats:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
module.exports = {
  checkKycStatus,
  getVenueOwnerProfile,
  changeVenueOwnerPassword,
  updateVenueOwnerProfile,
  getVenueOwnerStats
};
