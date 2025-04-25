const jwt = require("jsonwebtoken");
const User = require("../model/user");
const VenueOwner = require("../model/venueOwner");

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "default_secret"; // Ensure this is in .env

// Middleware to check if the user is authenticated
const checkAuthentication = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied, no token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Verify the token
    req.user = decoded; // Attach user info to the request
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

// Middleware to check if the user is an admin
const checkIsAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, admin role required." });
  }
  next(); // User is an admin, proceed to the next middleware or route
};

// Middleware to check if the user is a venue owner
const checkIsVenueOwner = (req, res, next) => {
  if (req.user.role !== "venueOwner") {
    return res
      .status(403)
      .json({ message: "Access denied, venue owner role required." });
  }
  next(); // User is a venue owner, proceed to the next middleware or route
};

// Middleware to check if the user is a regular user
const checkIsUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({ message: "Access denied, user role required." });
  }
  next(); // User is a regular user, proceed to the next middleware or route
};


// Middleware to check if the user is allowed to submit a review (only users)
const checkCanSubmitReview = (req, res, next) => {
  if (req.user.role !== "user") {
    return res
      .status(403)
      .json({ message: "Access denied, only users can submit reviews." });
  }
  next(); // User is allowed to submit a review
};


module.exports = {
  checkAuthentication,
  checkIsAdmin,
  checkIsVenueOwner,
  checkIsUser,
  checkCanSubmitReview,
};
