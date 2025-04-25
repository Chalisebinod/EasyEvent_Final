const User = require("../model/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Venue = require("../model/venue");

// Generate a random 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();


// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user without password
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    // Construct response object
    const userProfile = {
      ...user.toObject()

    };


    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Update Profile
async function updateUserProfile(req, res) {
  try {
    // Get the authenticated user's ID
    const userId = req.user.id;
    const { name, contact_number, email } = req.body;
    
    // Default to the value in the request body (if provided)
    let profile_image = req.body.profile_image;

    // If a file is uploaded, use the file's path instead.
    if (req.file) {
      profile_image = req.file.path; // or use req.file.filename based on your storage setup
    }

    // Update the allowed fields (profile_image now comes from the uploaded file if available)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, contact_number, profile_image, email },
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password field from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}


// Change Password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    console.log("Password ", currentPassword);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password Controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = otpExpires;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP for password reset
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password Controller

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    // Save the user with the updated password
    await user.save();

    // Notify user via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Successful",
      text: "Your password has been successfully reset. If you didn't make this request, please contact support immediately.",
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Password successfully updated", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
};
