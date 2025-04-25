const express = require("express");
const { sendMessage, receiveMessage, getAllMessages } = require("../controller/chat");
const { checkAuthentication, checkIsVenueOwner } = require("../middleware/middleware");


const router = express.Router();

router.post("/send",checkAuthentication, sendMessage); 
router.post("/recieve",checkAuthentication, receiveMessage); // Get a single message by ID
router.get("/conversation/",checkAuthentication, getAllMessages); // Get all messages between two users

module.exports = router;
