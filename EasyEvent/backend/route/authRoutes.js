const express = require("express");
const { checkAuthentication } = require("../middleware/middleware");
const { signup, signupVenueOwner, login, getUserDetails, autoLogin } = require("../controller/userAuth");

const router = express.Router();

// Define routes for signup and login
router.post("/signup", signup);
router.post("/signupVenueOwner", signupVenueOwner);
router.post("/login", login);
router.get("/getUser", checkAuthentication, getUserDetails);
router.get("/autoLogin", checkAuthentication,autoLogin);


module.exports = router;
