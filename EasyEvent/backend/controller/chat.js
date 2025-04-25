const mongoose = require("mongoose");
const Message = require("../model/chatSchema");
const User = require("../model/user");
const VenueOwner = require("../model/venueOwner");


// Send a message
const sendMessage = async (req, res) => {
  try {
    // Get sender id from req.user.id (authenticated user)
    const sender = req.user.id;
    const { receiver, message } = req.body;

    console.log("reciver and message", receiver)
    if (!receiver || !message) {
      return res.status(400).json({ error: "Receiver and message are required." });
    }

    // Verify that the receiver exists either as a User or a VenueOwner
    let receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      receiverUser = await VenueOwner.findById(receiver);
    }
    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found." });
    }

    // Create new message
    const newMessage = new Message({
      sender,
      receiver,
      message
    });
    
    // Save the message in the database
    await newMessage.save();

    // Emit real-time event if using Socket.io (e.g., if the receiver has joined their room)
    const io = req.app.get("io");
    io.to(receiver.toString()).emit("newMessage", newMessage);

    res.status(201).json({ success: true, message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const receiveMessage = async (req, res) => {
    try {
      // Get the logged‑in user's id from the authentication middleware
      const userId = req.user.id;
      // Expect the client to supply the partnerId as a query parameter
      const { partnerId } = req.body;
      if (!partnerId) {
        return res.status(400).json({ error: "Partner ID is required" });
      }
  
      // Find messages exchanged between the logged‑in user and the specified partner
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId }
        ]
      }).sort({ createdAt: 1 }); // Sorted from oldest to newest
  
      if (!messages.length) {
        return res.status(404).json({ error: "No messages found for this conversation" });
      }
  
      // Retrieve logged‑in user's details (check in User first, then VenueOwner)
      let selfDetails = await User.findById(userId, "name profile_image");
      if (!selfDetails) {
        selfDetails = await VenueOwner.findById(userId, "name profile_image");
      }
  
      // Retrieve partner's details (check in User first, then VenueOwner)
      let partnerDetails = await User.findById(partnerId, "name profile_image");
      if (!partnerDetails) {
        partnerDetails = await VenueOwner.findById(partnerId, "name profile_image");
      }
  
      // Mark as read any messages where the logged‑in user is the receiver and not yet marked as read
      for (const msg of messages) {
        if (msg.receiver.toString() === userId && !msg.readAt) {
          msg.readAt = new Date();
          await msg.save();
        }
      }
  
      // Prepare the messages array and add a senderLabel for clarity.
      const chatMessages = messages.map((msg) => ({
        _id: msg._id,
        message: msg.message,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        readAt: msg.readAt,
        sender: msg.sender.toString(),
        senderLabel: msg.sender.toString() === userId ? "You" : (partnerDetails ? partnerDetails.name : "Partner"),
      }));
  
      // Build and send the response with participants details and the conversation messages
      res.status(200).json({
        success: true,
        data: {
          participants: {
            self: {
              _id: userId,
              name: selfDetails ? selfDetails.name : "Unknown",
              profile_image: selfDetails ? selfDetails.profile_image : null,
            },
            partner: {
              _id: partnerId,
              name: partnerDetails ? partnerDetails.name : "Unknown",
              profile_image: partnerDetails ? partnerDetails.profile_image : null,
            },
          },
          messages: chatMessages,
        },
      });
    } catch (error) {
      console.error("Error receiving messages:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  

  const getAllMessages = async (req, res) => {
    try {
      const userId = req.user.id;
      const mongooseUserId = new mongoose.Types.ObjectId(userId);
  

      // Determine the conversation partner: if the logged‑in user is the sender, partner is the receiver; otherwise, partner is the sender.
      const conversationGroups = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: mongooseUserId }, { receiver: mongooseUserId }]
          }
        },
        {
          $addFields: {
            partner: {
              $cond: {
                if: { $eq: ["$sender", mongooseUserId] },
                then: "$receiver",
                else: "$sender"
              }
            }
          }
        },
        { $sort: { createdAt: -1 } }, // sort descending so the latest message comes first
        {
          $group: {
            _id: "$partner",
            lastMessage: { $first: "$$ROOT" }
          }
        },
        { $sort: { "lastMessage.createdAt": -1 } } // sort conversation groups by latest message time
      ]);
  
      // Format the result in a messenger chat list style: partner's name, profile image, last message text and time.
      const chatList = [];
      for (const conv of conversationGroups) {
        const partnerId = conv._id;
        let partnerDetails = await User.findById(partnerId, "name profile_image");
        if (!partnerDetails) {
          partnerDetails = await VenueOwner.findById(partnerId, "name profile_image");
        }
  
        chatList.push({
          name: partnerDetails ? partnerDetails.name : "Unknown",
          profile_image: partnerDetails ? partnerDetails.profile_image : null,
          lastMessage: conv.lastMessage.message,
          lastMessageTime: conv.lastMessage.createdAt,
          partnerId: partnerId
        });
      }
  
      res.status(200).json({ success: true, data: chatList });
    } catch (error) {
      console.error("Error fetching conversation list:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

module.exports = {
  sendMessage,
  receiveMessage,
  getAllMessages
};
