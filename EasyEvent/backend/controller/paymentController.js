const Payment = require("../model/payment");
const axios = require("axios");
const BookingRequest = require("../model/bookingSchema");
const Venue = require("../model/venue");

require('dotenv').config();

const Khalti_secret_key = process.env.Khalti_secret_key;
const KHALTI_BASE_URL = "https://dev.khalti.com/api/v2/";
const headers = {
  Authorization: `Key ${Khalti_secret_key}`,
  "Content-Type": "application/json",
};

// Initiate Payment - now accepts expected_amount from request (or you can derive it from the booking)
const initiatePayment = async (req, res) => {
  try {
    const {
      amount,
      expected_amount, // full amount expected by the owner
      purchase_order_id,
      purchase_order_name,
      return_url,
      website_url,
      bookingId,
    } = req.body;

    // Extract the user id from the access token via middleware (req.user)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found." });
    }

    const roundedAmount = Math.round(amount);

    // Find the related booking
    const booking = await BookingRequest.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (roundedAmount < 500) {
      return res.status(400).json({ success: false, message: "Payment must be a minimum of 500." });
    }

    // Prepare payload for Khalti. Amount is converted to paisa.
    const payload = {
      return_url,
      website_url,
      amount: roundedAmount * 100,
      purchase_order_id,
      purchase_order_name,
    };

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/initiate/`,
      payload,
      { headers }
    );

    // Check if a Payment record already exists for this booking
    let paymentRecord = await Payment.findOne({ booking: bookingId });

    if (paymentRecord) {
      // Update the existing Payment record with the new partial payment amount
      paymentRecord.amount = amount; // store the last payment amount if needed
      paymentRecord.cumulative_paid += amount; // update cumulative_paid
      // Optionally update the transaction_id if needed
      paymentRecord.transaction_id = response.data.pidx;
      paymentRecord.payment_status = paymentRecord.cumulative_paid >= paymentRecord.expected_amount ? "Completed" : "Pending";
      await paymentRecord.save();
    } else {
      // Create a new Payment record if none exists
      paymentRecord = new Payment({
        booking: bookingId,
        user: userId,
        amount: amount,
        cumulative_paid: amount, // initialize cumulative with the current amount
        expected_amount: expected_amount || amount,
        payment_method: "Khalti",
        transaction_id: response.data.pidx,
        payment_status: "Pending",
      });
      await paymentRecord.save();
    }

    // Update the booking payment status accordingly
    if (paymentRecord.cumulative_paid >= paymentRecord.expected_amount) {
      booking.payment_status = "Paid";
    } else if (paymentRecord.cumulative_paid > 0) {
      booking.payment_status = "Partially Paid";
    }
    await booking.save();

    res.json(response.data);
  } catch (error) {
    console.error("Khalti Payment Error:", error);
    if (error.response) {
      res.status(error.response.status || 400).json(error.response.data);
    } else if (error.request) {
      res.status(500).json({
        message: "No response from Khalti. Check your internet or API URL.",
      });
    } else {
      res.status(500).json({
        message: "Request failed before reaching Khalti.",
        error: error.message,
      });
    }
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (response.data.status !== "Completed") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed yet." });
    }

    // Find the payment entry
    const payment = await Payment.findOne({ transaction_id: pidx });
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found." });
    }

    // Update payment status
    payment.payment_status = "Completed";
    await payment.save();

    // Find the related booking
    const booking = await BookingRequest.findById(payment.booking);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Update payment status in BookingRequest based on the paid amount
    if (payment.amount >= payment.expected_amount) {
      booking.payment_status = "Paid";
    } else {
      booking.payment_status = "Partially Paid";
    }

    await booking.save();

    res.json(response.data);
  } catch (error) {
    console.error("Khalti Verification Error:", error);

    if (error.response) {
      res.status(error.response.status || 400).json(error.response.data);
    } else if (error.request) {
      res
        .status(500)
        .json({
          message: "No response from Khalti. Check your internet or API URL.",
        });
    } else {
      res
        .status(500)
        .json({
          message: "Request failed before reaching Khalti.",
          error: error.message,
        });
    }
  }
};

// Refund Payment - now calculates and stores the refund_amount, so you can later compute the net received amount (amount - refund_amount)
const refundPayment = async (req, res) => {
  try {
    const { pidx, refund_amount } = req.body;

    // Lookup transaction details at Khalti to verify the payment status
    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (response.data.status !== "Completed") {
      return res.status(400).json({ 
        success: false, 
        message: "Payment not completed yet." 
      });
    }

    // Find the payment entry
    const payment = await Payment.findOne({ transaction_id: pidx });
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment record not found." 
      });
    }

    // Compute net paid (i.e. cumulative_paid minus refunds already processed)
    const netPaid = payment.cumulative_paid - payment.refund_amount;
    if (netPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: "No funds available to refund.",
      });
    }

    // Determine the amount to refund: use refund_amount from request if provided and valid;
    // otherwise default to refund the full netPaid.
    let amountToRefund = netPaid;
    if (
      refund_amount !== undefined &&
      typeof refund_amount === "number" &&
      refund_amount > 0 &&
      refund_amount <= netPaid
    ) {
      amountToRefund = refund_amount;
    }

    // For full refund, we update refund_amount to equal cumulative_paid,
    // and for partial refund, we just add the refunded amount.
    if (amountToRefund === netPaid) {
      payment.refund_amount = payment.refund_amount + amountToRefund;
      payment.payment_status = "Refunded";
    } else {
      payment.refund_amount = payment.refund_amount + amountToRefund;
      const updatedNetPaid = payment.cumulative_paid - payment.refund_amount;
      payment.payment_status = updatedNetPaid <= 0 ? "Refunded" : "Partially Paid";
    }
    
    await payment.save();

    // Update the related booking's payment status accordingly
    const booking = await BookingRequest.findById(payment.booking);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found." 
      });
    }
    const finalNet = payment.cumulative_paid - payment.refund_amount;
    booking.payment_status = (finalNet <= 0) ? "Refunded" : "Partially Paid";
    await booking.save();

    res.json({
      success: true,
      refunded_amount: amountToRefund,
      net_paid_after_refund: payment.cumulative_paid - payment.refund_amount,
      transaction_details: response.data,
    });
  } catch (error) {
    console.error("Khalti Refund Error:", error);
    if (error.response) {
      return res.status(error.response.status || 400).json(error.response.data);
    } else if (error.request) {
      return res.status(500).json({
        message: "No response from Khalti. Check your internet or API URL.",
      });
    } else {
      return res.status(500).json({
        message: "Request failed before reaching Khalti.",
        error: error.message,
      });
    }
  }
};
const getOwnerPayments = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Find venues owned by the logged-in venue owner
    const venues = await Venue.find({ owner: ownerId }).select("_id");
    const venueIds = venues.map(venue => venue._id);

    // Find bookings under these venues
    const bookings = await BookingRequest.find({ venue: { $in: venueIds } }).select("_id");
    const bookingIds = bookings.map(booking => booking._id);

    // Fetch payments associated with those bookings
    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate("user", "name email")
      .populate("booking", "event_details.date venue")
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const fetchReceivedAmount = async (req, res) => {
  try {
    const { pidx } = req.body; // Transaction ID

    const response = await axios.post(
      `${KHALTI_BASE_URL}epayment/lookup/`,
      { pidx },
      { headers }
    );

    if (!response.data || response.data.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed or invalid transaction ID.",
      });
    }

    const receivedAmount = response.data.total_amount / 100; // Convert from paisa to NPR

    res.json({
      success: true,
      transaction_id: pidx,
      received_amount: receivedAmount,
      status: response.data.status,
    });
  } catch (error) {
    console.error("Khalti Fetch Amount Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch received amount.",
      error: error.message,
    });
  }
};

module.exports = { initiatePayment, verifyPayment, fetchReceivedAmount, refundPayment, getOwnerPayments };
