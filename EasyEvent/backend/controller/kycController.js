const Kyc = require("../model/KYC");
const VenueOwner = require("../model/venueOwner");
const Venue = require("../model/venue");
const upload = require("../controller/fileController");
const Notification = require("../model/notifications");

// Controller for handling KYC updates
const updateKYC = async (req, res) => {
  try {
    // Use the file upload middleware for the expected fields
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "citizenshipFront", maxCount: 1 },
      { name: "citizenshipBack", maxCount: 1 },
      { name: "pan", maxCount: 1 },
      { name: "map", maxCount: 1 },
      { name: "signature", maxCount: 1 },
      { name: "venueImages", maxCount: 3 },
    ])(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Extract and parse text fields from req.body
      const { venueName, venueAddress } = req.body;
      let parsedVenueAddress = venueAddress;
      if (typeof venueAddress === "string") {
        try {
          parsedVenueAddress = JSON.parse(venueAddress);
        } catch (parseError) {
          return res.status(400).json({
            error:
              "Invalid venueAddress format. Please provide a valid JSON object.",
          });
        }
      }

      // Validate required fields
      if (
        !venueName ||
        !parsedVenueAddress ||
        !parsedVenueAddress.address ||
        !parsedVenueAddress.city ||
        !parsedVenueAddress.state ||
        !parsedVenueAddress.zip_code
      ) {
        return res.status(400).json({
          error:
            "Missing required fields: venueName and all components of venueAddress.",
        });
      }

      // Get the venue owner details from the middleware (assumes req.user populated via auth middleware)
      const userId = req.user.id;
      const existingOwner = await VenueOwner.findById(userId);
      if (!existingOwner) {
        return res.status(404).json({ error: "Venue owner not found." });
      }

      // Validate venueImages count (exactly 2 or 3 images)
      const venueImages = req.files.venueImages;
      if (!venueImages || venueImages.length < 2 || venueImages.length > 3) {
        return res.status(400).json({
          error: "Please upload exactly 2 or 3 venue images.",
        });
      }

      // Build the update object with new file paths and details
      const updateData = {
        profile: req.files?.profile?.[0]?.path || "",
        citizenshipFront: req.files?.citizenshipFront?.[0]?.path || "",
        citizenshipBack: req.files?.citizenshipBack?.[0]?.path || "",
        pan: req.files?.pan?.[0]?.path || "",
        map: req.files?.map?.[0]?.path || "",
        signature: req.files?.signature?.[0]?.path || "",
        venueName,
        venueAddress: parsedVenueAddress,
        venueImages: venueImages.map((file) => file.path),
        // Additional fields can be added as needed
      };

      // Instead of creating a new document, check if one already exists for this owner
      const existingKyc = await Kyc.findOne({ owner: existingOwner._id });

      if (existingKyc) {
        // If the KYC record already exists and its status is not "rejected",
        // do not allow a new submission.
        if (existingKyc.verificationStatus.toLowerCase() !== "rejected") {
          return res.status(400).json({
            error:
              "You have already submitted a KYC. Please check your current status.",
            data: existingKyc,
          });
        }
        // If the previous KYC was rejected, allow reapplication by updating the record.
        Object.assign(existingKyc, updateData);
        existingKyc.verificationStatus = "pending"; // Reset status for reapplication
        existingKyc.rejectMsg = null; // Clear any previous rejection message
        await existingKyc.save();

        return res.json({
          message: "KYC reapplication submitted successfully!",
          data: existingKyc,
        });
      } else {
        // Create a new KYC record if one does not already exist
        const newKYC = new Kyc({
          owner: existingOwner._id,
          name: existingOwner.name,
          phone: existingOwner.contact_number,
          email: existingOwner.email,
          ...updateData,
        });
        await newKYC.save();
        return res.json({
          message: "KYC submitted successfully!",
          data: newKYC,
        });
      }
    });
  } catch (error) {
    console.error("Error updating KYC:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// Updated verifyKYC controller
const verifyKYC = async (req, res) => {
  try {
    const { kycId, status, message } = req.body;
    const adminId = req.user.id; // Assuming the admin ID is available via middleware
    console.log("KYC Id printing here", kycId);

    // Validate required fields
    if (!kycId || !status) {
      return res
        .status(400)
        .json({ error: "Missing required fields: kycId and status." });
    }

    // Allowed status values
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Allowed values: pending, approved, rejected.",
      });
    }

    // Fetch the KYC record
    const kycRecord = await Kyc.findById(kycId);
    if (!kycRecord) {
      return res.status(404).json({ error: "KYC record not found." });
    }

    // Check if the venueOwner (KYC owner) exists in the VenueOwner model
    const venueOwner = await VenueOwner.findById(kycRecord.owner);
    if (!venueOwner) {
      return res.status(400).json({ error: "Venue owner ID is invalid or does not exist." });
    }

    const previousStatus = kycRecord.verificationStatus; // Store previous status

    // Update KYC status and rejection message if applicable
    kycRecord.verificationStatus = status;
    if (status === "rejected") {
      kycRecord.rejectMsg = message || "No reason provided.";
    } else {
      kycRecord.rejectMsg = null;
    }
    await kycRecord.save();

    // Fetch the associated venue (if it exists)
    const existingVenue = await Venue.findOne({
      owner: kycRecord.owner,
      name: kycRecord.venueName,
    });

    // If approved, create the Venue (only if it doesn't already exist)
    if (status === "approved") {
      if (!existingVenue) {
        const newVenue = new Venue({
          name: kycRecord.venueName,
          owner: venueOwner._id, // Ensuring only a registered VenueOwner's ID is used
          location: kycRecord.venueAddress,
          description: "Venue verified via KYC.",
          verification_status: "Verified",
          profile_image: kycRecord.profile || "",
          contact_details: {
            phone: kycRecord.phone,
            email: kycRecord.email,
          },
        });

        await newVenue.save();

        // Update the VenueOwner's venues array and mark the owner as verified
        await VenueOwner.findByIdAndUpdate(kycRecord.owner, {
          $push: { venues: newVenue._id },
          $set: { verified: true, status: "verified" },
        });
      } else {
        // Update the existing venue's verification status to "Verified"
        existingVenue.verification_status = "Verified";
        await existingVenue.save();

        // Ensure the owner is marked as verified
        await VenueOwner.findByIdAndUpdate(kycRecord.owner, {
          $set: { verified: true, status: "verified" },
        });
      }
    } else {
      // If KYC is not approved, set the venue's verification status to "Pending"
      if (existingVenue) {
        existingVenue.verification_status = "Pending";
        await existingVenue.save();
      }

      // Update the VenueOwner's verified status accordingly
      await VenueOwner.findByIdAndUpdate(kycRecord.owner, {
        $set: { verified: false, status: status },
      });
    }

    // If status changed from "approved" to "rejected", delete the existing venue
    // and update the VenueOwner's venues array and verified status accordingly.
    if (previousStatus === "approved" && status === "rejected") {
      if (existingVenue) {
        await Venue.deleteOne({ _id: existingVenue._id });
        await VenueOwner.findByIdAndUpdate(kycRecord.owner, {
          $pull: { venues: existingVenue._id },
          $set: { verified: false, status: "rejected" },
        });
      }
    }

    // Create a notification for the VenueOwner
    const notificationMessage =
      status === "approved"
        ? "Your KYC verification has been approved and your venue has been created."
        : status === "rejected"
        ? `Your KYC verification was rejected. Reason: ${message || "No reason provided."}`
        : "Your KYC verification is pending.";
    const notification = new Notification({
      userId: kycRecord.owner,
      message: notificationMessage,
      role: "VenueOwner",
    });
    await notification.save();

    res.json({
      message: `KYC status updated successfully to ${status}.`,
      data: kycRecord,
    });
  } catch (error) {
    console.error("Error verifying KYC:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// Other KYC controllers remain unchanged

const getAllKYC = async (req, res) => {
  try {
    const { status } = req.query; // Get the status from query params

    let filter = {};
    if (status) {
      filter.verificationStatus = status;
    }

    const kycRecords = await Kyc.find(filter)
      .populate("owner", "name contact_number email")
      .exec();

    if (!kycRecords || kycRecords.length === 0) {
      return res.status(404).json({ error: "No KYC records found." });
    }

    const kycData = kycRecords.map((record) => ({
      _id: record._id,
      venueOwnerName: record.owner?.name || "Unknown",
      venueName: record.venueName,
      location: `${record.venueAddress.address}, ${record.venueAddress.city}, ${record.venueAddress.state}, ${record.venueAddress.zip_code}`,
      phoneNumber: record.owner?.contact_number || "N/A",
      status: record.verificationStatus,
    }));

    res.json({
      message: "KYC records fetched successfully.",
      data: kycData,
    });
  } catch (error) {
    console.error("Error fetching KYC records:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

const getProfileKyc = async (req, res) => {
  try {
    // Get the kycId from the query parameters
    const { kycId } = req.params;

    if (!kycId) {
      return res.status(400).json({ error: "KYC id is required." });
    }

    // Find the KYC record by its _id and populate the owner details
    const kycRecord = await Kyc.findById(kycId)
      .populate("owner", "name contact_number email")
      .exec();

    if (!kycRecord) {
      return res.status(404).json({ error: "KYC record not found." });
    }

    const kycData = {
      venueOwnerName: kycRecord.owner?.name || "N/A",
      venueName: kycRecord.venueName,
      venueAddress: {
        address: kycRecord.venueAddress.address,
        city: kycRecord.venueAddress.city,
        state: kycRecord.venueAddress.state,
        zip_code: kycRecord.venueAddress.zip_code,
      },
      phoneNumber: kycRecord.owner?.contact_number || "N/A",
      email: kycRecord.owner?.email || "N/A",
      status: kycRecord.verificationStatus,
      rejectMsg: kycRecord.rejectMsg || null,
      profileImage: kycRecord.profile || "No profile image",
      citizenshipFront: kycRecord.citizenshipFront || "No file uploaded",
      citizenshipBack: kycRecord.citizenshipBack || "No file uploaded",
      pan: kycRecord.pan || "No file uploaded",
      map: kycRecord.map || "No map file uploaded",
      signature: kycRecord.signature || "No signature uploaded",
      venueImages: kycRecord.venueImages || "No venue images uploaded",
    };

    res.json({
      message: "KYC profile fetched successfully.",
      data: kycData,
    });
  } catch (error) {
    console.error("Error fetching KYC profile:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// check venueowner kcy
const getVenueOwnerProfileKyc = async (req, res) => {
  try {
    // Get the user id from the authenticated user (set by your auth middleware)
    const userId = req.user.id;

    // Find the KYC record associated with this user
    const kycRecord = await Kyc.findOne({ owner: userId })
      .populate("owner", "name contact_number email")
      .exec();

    if (!kycRecord) {
      return res
        .status(404)
        .json({ error: "KYC record not found for this user." });
    }

    const kycData = {
      venueOwnerName: kycRecord.owner?.name || "N/A",
      venueName: kycRecord.venueName,
      venueAddress: {
        address: kycRecord.venueAddress.address,
        city: kycRecord.venueAddress.city,
        state: kycRecord.venueAddress.state,
        zip_code: kycRecord.venueAddress.zip_code,
      },
      phoneNumber: kycRecord.owner?.contact_number || "N/A",
      email: kycRecord.owner?.email || "N/A",
      status: kycRecord.verificationStatus,
      rejectMsg: kycRecord.rejectMsg || null,
      profileImage: kycRecord.profile || "No profile image",
      citizenshipFront: kycRecord.citizenshipFront || "No file uploaded",
      citizenshipBack: kycRecord.citizenshipBack || "No file uploaded",
      pan: kycRecord.pan || "No file uploaded",
      map: kycRecord.map || "No map file uploaded",
      signature: kycRecord.signature || "No signature uploaded",
      venueImages: kycRecord.venueImages || "No venue images uploaded",
    };

    res.json({
      message: "KYC profile fetched successfully.",
      data: kycData,
    });
  } catch (error) {
    console.error("Error fetching KYC profile:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

const getVenueOwnerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const venueOwner = await VenueOwner.findById(userId);
    if (!venueOwner) {
      return res.status(404).json({ error: "Venue owner not found." });
    }
    res.json({
      message: "Venue owner profile fetched successfully.",
      data: {
        name: venueOwner.name,
        contact_number: venueOwner.contact_number,
        email: venueOwner.email,
        address: venueOwner.address || null,
        city: venueOwner.city || null,
        state: venueOwner.state || null,
        zip_code: venueOwner.zip_code || null,
        venueName: venueOwner.venueName || null,
      },
    });
  } catch (error) {
    console.error("Error fetching venue owner profile:", error.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

module.exports = {
  updateKYC,
  verifyKYC,
  getAllKYC,
  getProfileKyc,
  getVenueOwnerProfile,
  getVenueOwnerProfileKyc,
};
