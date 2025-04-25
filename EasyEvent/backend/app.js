const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const socketIo = require("socket.io");
const http = require("http"); // For creating an HTTP server
const reviewRoutes = require("./route/reviewRoutes");

const authRoutes = require("./route/authRoutes");
const userSelfRoute = require("./route/userSelfRoute");
const adminRoute = require("./route/adminRoute");
const venueOwnerRoute = require("./route/venueOwnerRoutes");
const kycRoute = require("./route/kycRoute");
const venueRoutes = require("./route/venueRoutes");
const bookingRoutes = require("./route/userBookingRoute");
const notificationRoutes = require("./route/notificationRoute");
const hallRoutes = require("./route/hallRoute");
const venueBookingRoutes = require("./route/venueBookingRoute");
const foodRoutes = require("./route/foodRoute");
const paymentRoute = require("./route/paymentRoute");
const chatRoute = require("./route/chat");


dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

// Routes
app.use("/api", authRoutes);
app.use("/api/auth/payment", paymentRoute);
app.use("/api", userSelfRoute);
app.use("/api", adminRoute);
app.use("/api", venueOwnerRoute);
app.use("/api/kyc", kycRoute);
app.use("/api", venueRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/halls", hallRoutes);
app.use("/api/booking", venueBookingRoutes);
app.use("/api", foodRoutes);
app.use("/api/chat", chatRoute);
app.use("/api/reviews", reviewRoutes);


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/EasyEvent", {})
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Create HTTP server and integrate Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }, // Adjust CORS settings as needed
});

// **Set the Socket.io instance on the Express app**
app.set("io", io);

// Socket.io events for real-time messaging
io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // When a client joins a conversation room
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Start the server using the HTTP server with Socket.io integrated
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
