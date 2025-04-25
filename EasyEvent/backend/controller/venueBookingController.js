// bookingController.js
const BookingRequest = require("../model/request");
const Booking = require("../model/bookingSchema");
const User = require("../model/user");
const VenueOwner = require("../model/venueOwner");
const nodemailer = require("nodemailer");
const Payment = require("../model/payment");
const { Agreement } = require("../model/agreementSchema");
const PDFDocument = require('pdfkit');
const path = require('path');

// Create a new booking request
async function createBooking(req, res) {
  const userId = req.user.id;

  try {
    const {
      venue,
      hall,
      event_details,
      selected_foods,
      additional_services,
      pricing,
    } = req.body;

    // Check if the user exists in either User or VenueOwner schema
    const userExists = await User.findById(userId);
    const venueOwnerExists = await VenueOwner.findById(userId);

    if (!userExists && !venueOwnerExists) {
      return res.status(404).json({
        message: "User not found in both User and VenueOwner collections",
      });
    }

    // Check if a booking for the same venue by the same user already exists
    const existingBooking = await BookingRequest.findOne({
      user: userId,
      venue,
      status: { $nin: ["Rejected", "Completed"] }, // Exclude Rejected and Completed bookings
    });

    if (existingBooking) {
      return res.status(400).json({
        message:
          "You have already booked this venue. Only one active booking per venue is allowed.",
      });
    }

    // Ensure selected_foods is an array (defaulting to empty if not provided)
    const foods = Array.isArray(selected_foods) ? selected_foods : [];

    // Calculate food cost and total cost
    const foodCost =
      pricing.final_per_plate_price * event_details.guest_count;
    const additionalServicesCost =
      additional_services?.reduce(
        (sum, service) => sum + (service.price || 0),
        0
      ) || 0;

    // Create new booking request instance
    const booking = new BookingRequest({
      user: userId,
      venue,
      hall,
      event_details,
      selected_foods: foods,
      additional_services: additional_services || [],
      pricing: {
        ...pricing,
        food_cost: foodCost,
        additional_services_cost: additionalServicesCost,
        total_cost: foodCost + additionalServicesCost,
        amount_paid: 0,
        balance_amount: foodCost + additionalServicesCost,
      },
    });

    const savedBooking = await booking.save();
    return res.status(201).json({ booking: savedBooking });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
}

// Update or edit an existing booking request's details
async function updateBooking(req, res) {
  try {
    const bookingId = req.params.id;
    let booking = await BookingRequest.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Disallow update if booking is already cancelled.
    if (booking.status === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Cancelled bookings cannot be updated" });
    }

    const updateData = { ...req.body, updated_at: new Date() };
    booking = await BookingRequest.findByIdAndUpdate(bookingId, updateData, {
      new: true,
    });
    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(500).json({
      message: "Failed to update booking",
      error: error.message,
    });
  }
}

// Cancel a booking request by setting its status to "Cancelled"
async function cancelBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await BookingRequest.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "Cancelled") {
      return res
        .status(400)
        .json({ message: "Booking is already cancelled" });
    }

    booking.status = "Cancelled";
    booking.updated_at = new Date();
    await booking.save();
    return res.status(200).json({
      booking,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    return res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
}

// Permanently delete a booking request
async function deleteBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await BookingRequest.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res
      .status(200)
      .json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    return res.status(500).json({
      message: "Failed to delete booking",
      error: error.message,
    });
  }
}

// Fetch all booking requests for a specific venue
async function getRequestsByVenue(req, res) {
  try {
    const { venueId } = req.params;
    let bookingRequests = await BookingRequest.find({ venue: venueId })
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price")
      .sort({ created_at: -1 });

    // Manually fetch user details from User or VenueOwner and include profile_image
    bookingRequests = await Promise.all(
      bookingRequests.map(async (booking) => {
        let user = await User.findById(booking.user).select(
          "name email profile_image"
        );
        if (!user) {
          user = await VenueOwner.findById(booking.user).select(
            "name email profile_image"
          );
        }
        return {
          ...booking.toObject(),
          user: user
            ? { _id: booking.user, name: user.name, email: user.email, profile_image: user.profile_image }
            : null,
        };
      })
    );

    return res.status(200).json({ requests: bookingRequests });
  } catch (error) {
    console.error("Fetch Requests Error:", error);
    return res.status(500).json({
      message: "Failed to fetch booking requests",
      error: error.message,
    });
  }
}

// Update booking request status (Accept or Reject) and, if accepted, create a final booking
async function updateRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, reason } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await BookingRequest.findById(requestId)
      .populate("user")
      .populate("venue")
      .populate("hall")
      .populate("selected_foods");
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking request not found" });
    }

    booking.status = status;
    booking.reason = reason;
    booking.updated_at = new Date();
    await booking.save();

    if (status === "Accepted") {
      const eventDate = new Date(booking.event_details.date);
      const today = new Date();
      let bookingPeriod = "Future";
      if (eventDate < today) {
        bookingPeriod = "Past";
      } else if (eventDate.toDateString() === today.toDateString()) {
        bookingPeriod = "Current";
      }

      const foodCost =
        booking.pricing.final_per_plate_price *
        booking.event_details.guest_count;
      const additionalServicesCost =
        booking.additional_services?.reduce(
          (sum, service) => sum + (service.price || 0),
          0
        ) || 0;

      const newBooking = new Booking({
        user: booking.user._id,
        venue: booking.venue._id,
        hall: booking.hall._id,
        event_details: booking.event_details,
        selected_foods: booking.selected_foods.map((food) => food._id),
        requested_foods: booking.requested_foods || [],
        additional_services: booking.additional_services || [],
        pricing: {
          original_per_plate_price:
            booking.pricing.original_per_plate_price,
          user_offered_per_plate_price:
            booking.pricing.user_offered_per_plate_price,
          final_per_plate_price:
            booking.pricing.final_per_plate_price,
          food_cost: foodCost,
          additional_services_cost: additionalServicesCost,
          total_cost: foodCost + additionalServicesCost,
          amount_paid: 0,
          balance_amount: foodCost + additionalServicesCost,
          discount_amount: 0,
        },
        status: "Accepted",
        payment_status: "Unpaid",
        booking_period: bookingPeriod,
        reason: reason || "Booking approved by venue owner",
      });

      await newBooking.save();
    }

    let htmlContent = "";
    if (status === "Accepted") {
      htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width:600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #2e7d32; text-align: center;">Booking Request Approved</h2>
              <p>Dear ${booking.user.name},</p>
              <p>Great news! Your booking request has been <strong>approved</strong> by <strong>${booking.venue.name}</strong>.</p>
              <hr style="margin: 20px 0;">
              <h4>Event Details</h4>
              <ul style="line-height: 1.6;">
                <li><strong>Event Type:</strong> ${booking.event_details.event_type}</li>
                <li><strong>Date:</strong> ${new Date(
                  booking.event_details.date
                ).toLocaleDateString()}</li>
                <li><strong>Venue:</strong> ${booking.venue.name}</li>
                <li><strong>Hall:</strong> ${booking.hall.name}</li>
              </ul>
              <p>Our team will contact you shortly to discuss the next steps, including payment details and any additional requirements.</p>
              <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
              <p style="text-align: right; margin-top: 20px;">Best regards,<br>${booking.venue.name} Team</p>
            </div>
          </body>
        </html>
      `;
    } else if (status === "Rejected") {
      htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width:600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #d32f2f; text-align: center;">Booking Request Not Approved</h2>
              <p>Dear ${booking.user.name},</p>
              <p>We regret to inform you that your booking request for <strong>${booking.venue.name}</strong> could not be approved at this time.</p>
              <hr style="margin: 20px 0;">
              <h4>Reason</h4>
              <p style="background-color: #ffeeee; padding: 10px; border-radius: 5px;">${reason}</p>
              <p>We encourage you to explore alternative dates or our other venues. Our team is always here to help you find the perfect venue for your event.</p>
              <p style="text-align: right;">Best regards,<br>${booking.venue.name} Team</p>
            </div>
          </body>
        </html>
      `;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.user.email,
      subject:
        status === "Accepted"
          ? "Your Booking Request has been Approved!"
          : "Update on Your Booking Request",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      booking,
      message: `Booking ${status.toLowerCase()} successfully and email sent.`,
    });
  } catch (error) {
    console.error("Update Request Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking request status",
      error: error.message,
    });
  }
}

// Fetch booking details for a specific request by its ID
async function getBookingByRequestId(req, res) {
  try {
    const { requestId } = req.params;

    let booking = await BookingRequest.findById(requestId)
      .populate("user", "name email contact profile_image")
      .populate("venue", "name location")
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price")
      .populate("additional_services", "name description");

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking request not found" });
    }

    let userId = null;
    if (booking.user) {
      userId =
        typeof booking.user === "object"
          ? booking.user._id || booking.user
          : booking.user;
    } else {
      userId = booking._doc.user;
    }

    let user = await User.findById(userId).select(
      "name email contact profile_image"
    );
    if (!user) {
      user = await VenueOwner.findById(userId).select(
        "name email contact_number profile_image"
      );
    }
    booking.user = user;

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Fetch Booking By RequestId Error:", error);
    return res.status(500).json({
      message: "Failed to fetch booking request",
      error: error.message,
    });
  }
}

// Get all approved bookings for a venue
async function getApprovedBookings(req, res) {
  try {
    const { venueId } = req.params;
    const { period } = req.query;

    const filter = {
      venue: venueId,
      status: { $in: ["Accepted", "Running", "Completed"] },
      isDeleted: false,
    };

    if (period) {
      filter.booking_period = period;
    }

    const bookings = await Booking.find(filter)
      .populate("user", "name email contact_number profile_image")
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price")
      .populate("requested_foods", "name price")
      .sort({ "event_details.date": 1 });

    // Fetch corresponding request IDs
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking) => {
        if (!booking.user || !booking.venue) {
          console.warn("Invalid booking data:", booking);
          return null; // Skip invalid bookings
        }

        const request = await BookingRequest.findOne({
          venue: booking.venue,
          user: booking.user._id,
        }).select("_id");

        return {
          ...booking.toObject(),
          requestId: request ? request._id : null,
        };
      })
    );

    // Filter out null values from the enhancedBookings array
    const validBookings = enhancedBookings.filter((booking) => booking !== null);

    return res.status(200).json({
      success: true,
      bookings: validBookings,
      count: validBookings.length,
    });
  } catch (error) {
    console.error("Get Approved Bookings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved bookings",
      error: error.message,
    });
  }
}

// Create a booking directly by the venue owner
async function createOwnerBooking(req, res) {
  try {
    const {
      venue,
      hall,
      event_details,
      selected_foods,
      additional_services,
      pricing,
      user, // Optional: If booking for a specific user
    } = req.body;

    const eventDate = new Date(event_details.date);
    const today = new Date();
    let bookingPeriod = "Future";
    if (eventDate < today) {
      bookingPeriod = "Past";
    } else if (eventDate.toDateString() === today.toDateString()) {
      bookingPeriod = "Current";
    }

    const newBooking = new Booking({
      user: user || req.user.id,
      venue,
      hall,
      event_details,
      selected_foods: selected_foods || [],
      additional_services: additional_services || [],
      pricing,
      status: "Accepted",
      payment_status: "Unpaid",
      booking_period: bookingPeriod,
      owner_notes: "Booking created directly by venue owner",
    });

    const savedBooking = await newBooking.save();

    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate("user", "name email")
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price");

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error("Create Owner Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
}

// Get details of a specific approved booking
async function getApprovedBookingDetails(req, res) {
  try {
    const ownerId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("user", "name email contact_number profile_image")
      .populate({
        path: "venue",
        populate: {
          path: "owner",
          select: "_id name",
        },
      })
      .populate("hall", "name capacity")
      .populate("selected_foods", "name price")
      .populate("requested_foods", "name price")
      .populate("additional_services", "name description");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Approved booking not found",
      });
    }

    if (booking.venue.owner._id.toString() !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    const payment = await Payment.findOne({ booking: bookingId });
    const bookingData = booking.toObject();

    if (payment) {
      bookingData.payment_details = {
        advance_amount: payment.amount,
        due_date: payment.due_date,
        instructions: payment.payment_instructions,
        payment_status: payment.payment_status,
        payment_type: payment.payment_type,
        paid_at: payment.paid_at,
      };
    }

    bookingData.pricing_summary = {
      per_plate_details: {
        original: booking.pricing.original_per_plate_price,
        user_offered: booking.pricing.user_offered_per_plate_price,
        final: booking.pricing.final_per_plate_price,
      },
      guest_count: booking.event_details.guest_count,
      total_food_cost:
        booking.pricing.final_per_plate_price *
        booking.event_details.guest_count,
      additional_services_cost: booking.additional_services.reduce(
        (sum, service) => sum + (service.price || 0),
        0
      ),
      total_cost: booking.pricing.total_cost,
      payment_status: booking.payment_status,
      amount_paid: payment ? payment.amount : 0,
      balance_amount:
        booking.pricing.total_cost - (payment ? payment.amount : 0),
    };

    return res.status(200).json({
      success: true,
      booking: bookingData,
    });
  } catch (error) {
    console.error("Get Approved Booking Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved booking details",
      error: error.message,
    });
  }
}

// Helper function to generate PDF from agreement and booking details.
const generateAgreementPDF = async (booking, agreement) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ----- Page 1: Agreement Intro & Terms -----
      // Header
      doc
        .fontSize(20)
        .fillColor('#2e7d32')
        .text('Venue Booking Agreement', { align: 'center' });
      doc.moveDown(0.5);
      
      // Effective Date
      const effectiveDate = new Date().toLocaleDateString();
      doc
        .fontSize(10)
        .fillColor('#000')
        .text(`Effective Date: ${effectiveDate}`, { align: 'center' });
      doc.moveDown(1.5);

      // Introductory Paragraph
      doc.fontSize(12).fillColor('#000');
      doc.text(
        `This Venue Booking Agreement (the "Agreement") is made and entered into on ${effectiveDate} by and between ${agreement.ownerName}, having an address of ${agreement.ownerAddress}, (hereinafter referred to as the "Owner") and ${agreement.consumerName}, having an address of ${agreement.consumerAddress}, (hereinafter referred to as the "Client").`
      );
      doc.moveDown();

      // Recitals / Background
      doc.text(
        `WHEREAS, the Client desires to host an event at the venue known as "${agreement.eventVenue}", located at ${booking.venue.location}, on ${new Date(agreement.eventDate).toLocaleDateString()} for a duration of ${agreement.eventDuration} with an expected guest count of ${agreement.totalPeople}; and`
      );
      doc.moveDown();
      doc.text(
        `WHEREAS, the Owner agrees to provide the venue and related services for the event in accordance with the terms set forth herein;`
      );
      doc.moveDown();
      doc.text('NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties agree as follows:');
      doc.moveDown(1.5);

      // ----- Section 1: Event and Payment Details -----
      doc.font('Helvetica-Bold').text('1. Event and Payment Details', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').text(
        `The Client shall host the event at "${agreement.eventVenue}" on ${new Date(agreement.eventDate).toLocaleDateString()}. The services provided by the Owner include the use of the venue, facilities, and any additional services as specified separately.`
      );
      doc.moveDown();
      doc.text(
        `The total cost for the event is Rs. ${booking.pricing.total_cost}. The Client agrees to pay a required advance amount of Rs. ${agreement.deposit} on or before ${new Date(agreement.depositDueDate).toLocaleDateString()}. The remaining balance of Rs. ${agreement.balance} is due on ${new Date(agreement.balanceDueDate).toLocaleDateString()}.`
      );
      doc.moveDown(1.5);

      // ----- Section 2: Terms and Conditions -----
      doc.font('Helvetica-Bold').text('2. Terms and Conditions', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').text(
        `The services provided by the Owner shall be performed in accordance with industry standards and in a professional manner. The Agreement references the following templates for standard terms:`
      );
      doc.moveDown(0.5);
      doc.text(`- Terms Template ID: ${agreement.termsTemplate}`);
      doc.text(`- Rules Template ID: ${agreement.rulesTemplate}`);
      doc.text(`- Cancellation Template ID: ${agreement.cancellationTemplate}`);
      if (agreement.customTerms) {
        doc.moveDown(0.5);
        doc.text(`In addition, the following custom terms apply: ${agreement.customTerms}`);
      }
      doc.moveDown(1.5);

      // ----- Section 3: Signatures -----
      // This page ends without digital signature instructions.
      doc.addPage();

      doc.font('Helvetica-Bold').fontSize(12).text('IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the Effective Date.', {
        align: 'center'
      });
      doc.moveDown(2);

      // Owner Signature Section
      doc.font('Helvetica-Bold').text('Owner Signature:', { underline: true });
      doc.moveDown(0.5);
      if (agreement.signatureData) {
        const signaturePath = path.resolve(agreement.signatureData);
        try {
          // Adjust size and position as needed.
          doc.image(signaturePath, { fit: [150, 50] });
        } catch (imgErr) {
          doc.text('Owner signature image not available.');
        }
      } else {
        doc.text('_______________________________');
      }
      doc.moveDown(2);

      // Client Signature Placeholder
      doc.font('Helvetica-Bold').text('Client Signature:', { underline: true });
      doc.moveDown(1);
      // Draw a signature line for the client
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica').text('Please sign above and return a printed copy of this Agreement.', { align: 'center' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(10)
         .fillColor('#555')
         .text('This Agreement is intended to be printed, signed manually, and returned by the Client. It represents the entire understanding between the parties regarding the event booking.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const sendFinalConfirmationEmail = async (booking, payment, agreement) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let pdfBuffer;
  try {
    pdfBuffer = await generateAgreementPDF(booking, agreement);
  } catch (pdfError) {
    console.error("PDF Generation Error:", pdfError);
    pdfBuffer = null;
  }

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width:600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #2e7d32; text-align: center;">Booking Confirmation and Payment Details</h2>
          <p>Dear ${booking.user.name},</p>
          <p>Your booking at <strong>${booking.venue.name}</strong> has been confirmed. Please review your booking details and payment instructions below:</p>
          <hr style="margin: 20px 0;">
          <h4>Event Details</h4>
          <ul style="line-height: 1.6;">
            <li><strong>Event Type:</strong> ${booking.event_details.event_type}</li>
            <li><strong>Date:</strong> ${new Date(booking.event_details.date).toLocaleDateString()}</li>
            <li><strong>Venue:</strong> ${booking.venue.name}</li>
            <li><strong>Guest Count:</strong> ${booking.event_details.guest_count}</li>
          </ul>
          <h4>Payment Details</h4>
          <ul style="line-height: 1.6;">
            <li><strong>Required Advance Amount:</strong> Rs. ${payment.amount}</li>
            <li><strong>Due Date:</strong> ${new Date(payment.due_date).toLocaleDateString()}</li>
            <li><strong>Payment Instructions:</strong> ${payment.payment_instructions}</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/continue-payment/${booking._id}" style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; color: #ffffff; text-decoration: none; border-radius: 5px;">Continue Your Payment</a>
          </div>
          <p style="color: #d32f2f; font-weight: bold; text-align: center; margin-top: 20px;">
            Important: Please complete the advance payment before the due date to confirm your booking.
          </p>
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          <p style="text-align: right; margin-top: 20px;">Best regards,<br>${booking.venue.name} Team</p>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.user.email,
    subject: "Venue Booking Confirmation and Payment Details",
    html: htmlContent,
    attachments: pdfBuffer
      ? [{
          filename: "Agreement.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        }]
      : [],
  };

  await transporter.sendMail(mailOptions);
};



// Set payment details for an approved booking
// Updated setPaymentDetails function based on updated Payment model

async function setPaymentDetails(req, res) {
  try {
    const { bookingId } = req.params;
    const { advanceAmount, dueDate, paymentInstructions, sendEmail = false } = req.body;

    if (!advanceAmount || !dueDate || !paymentInstructions) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required payment details",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "venue",
        populate: { path: "owner", select: "_id" },
      })
      .populate("user", "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.venue.owner._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to set payment details for this booking",
      });
    }

    const existingPayment = await Payment.findOne({ booking: bookingId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment details already exist for this booking",
      });
    }

    // Create Payment document using new model fields:
    //   - amount: the advance paid
    //   - expected_amount: the full total cost from the booking pricing
    //   - payment_method defaults to "Khalti"
    const payment = new Payment({
      booking: bookingId,
      user: booking.user._id,
      amount: advanceAmount,
      expected_amount: booking.pricing.total_cost, // full expected amount
      payment_type: "Advance",
      due_date: new Date(dueDate),
      payment_instructions: paymentInstructions,
      payment_status: "Pending",
    });

    await payment.save();
    booking.payment_status = "Unpaid";
    await booking.save();

    if (sendEmail) {
      await sendFinalConfirmationEmail(booking, payment);
    }

    return res.status(200).json({
      success: true,
      message: "Payment details set successfully",
      payment: payment,
    });
  } catch (error) {
    console.error("Set Payment Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set payment details",
      error: error.message,
    });
  }
}

// Upload owner's signature and optionally send final confirmation email
async function uploadOwnerSignature(req, res) {
  try {
    const { bookingId } = req.params;
    const { sendFinalEmail } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No signature file provided",
      });
    }

    // Retrieve booking details
    const booking = await Booking.findById(bookingId)
      .populate("user")
      .populate("venue");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found for id: ${bookingId}`,
      });
    }

    // Retrieve payment details
    const payment = await Payment.findOne({ booking: bookingId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment details not found for booking id: ${bookingId}`,
      });
    }

    // Retrieve agreement using the bookingId field as defined in the schema
    const agreement = await Agreement.findOne({ bookingId: bookingId });
    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: `Agreement not found for booking id: ${bookingId}`,
      });
    }

    // Update agreement with signature data using the correct field
    agreement.signatureData = req.file.path;
    // (Optionally, if you need to store a date, add a new field in your schema and set it here.)
    await agreement.save();

    // Optionally generate the PDF and send the final confirmation email if requested
    if (sendFinalEmail === "true") {
      await sendFinalConfirmationEmail(booking, payment, agreement);
    }

    return res.status(200).json({
      success: true,
      message: "Signature uploaded and final confirmation email sent",
    });
  } catch (error) {
    console.error("Upload Signature Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload signature",
      error: error.message,
    });
  }
}

async function getPaymentDetails(req, res) {
  try {
    const { bookingId } = req.params;

    // Optionally, fetch booking pricing info from Booking Schema
    const booking = await Booking.findById(bookingId)
      .select("pricing payment_status")
      .lean();
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Fetch Payment data from Payment model
    const payment = await Payment.findOne({ booking: bookingId }).lean();
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment details not found for this booking",
      });
    }

    // Optionally, compute a summary to send to the frontend
    const summary = {
      totalCost: booking.pricing.total_cost,
      amountPaid: payment.amount,
      balanceAmount: booking.pricing.total_cost - payment.amount,
    };

    return res.status(200).json({
      success: true,
      booking,
      payment,
      summary,
    });
  } catch (error) {
    console.error("Get Payment Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
}



module.exports = {
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getRequestsByVenue,
  updateRequestStatus,
  getBookingByRequestId,
  getApprovedBookings,
  createOwnerBooking,
  getApprovedBookingDetails,
  setPaymentDetails,
  uploadOwnerSignature,
  getPaymentDetails
};
