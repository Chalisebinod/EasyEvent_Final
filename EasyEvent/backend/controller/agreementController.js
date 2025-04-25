

const { Agreement, AgreementTemplate } = require("../model/agreementSchema");
const Booking = require("../model/bookingSchema");
const VenueOwner = require("../model/venueOwner");
const Payment = require("../model/payment");

exports.createTemplate = async (req, res) => {
  try {
    const { title, type, content, venue } = req.body;

    // Validate template type
    if (!["terms", "rules", "cancellation"].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid template type" 
      });
    }

    const newTemplate = new AgreementTemplate({
      title,
      type,
      content,
      venue
    });

    const savedTemplate = await newTemplate.save();
    return res.status(201).json({ 
      success: true,
      template: savedTemplate 
    });
  } catch (error) {
    console.error("Create Template Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to create template", 
      error: error.message 
    });
  }
};

// Get templates by venue and type
exports.getTemplatesByVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { type } = req.query;

    const filter = { venue: venueId };
    if (type) {
      filter.type = type;
    }

    const templates = await AgreementTemplate.find(filter)
      .sort({ isDefault: -1, created_at: -1 });

    return res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error("Get Templates Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: error.message
    });
  }
};

// Set a template as default for a venue and type
exports.setDefaultTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await AgreementTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    // Remove default flag from other templates of same type and venue
    await AgreementTemplate.updateMany(
      { 
        venue: template.venue, 
        type: template.type,
        _id: { $ne: templateId }
      },
      { isDefault: false }
    );

    // Set this template as default
    template.isDefault = true;
    await template.save();

    return res.status(200).json({
      success: true,
      message: "Template set as default",
      template
    });
  } catch (error) {
    console.error("Set Default Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set default template",
      error: error.message
    });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;

    const template = await AgreementTemplate.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    return res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    console.error("Update Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: error.message
    });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await AgreementTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    // Don't allow deletion if it's the only template or if it's the default template
    const templatesCount = await AgreementTemplate.countDocuments({
      venue: template.venue,
      type: template.type
    });

    if (templatesCount === 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the only template of this type. At least one template must remain."
      });
    }

    if (template.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the default template. Please set another template as default first."
      });
    }

    // Use findByIdAndDelete instead of remove()
    await AgreementTemplate.findByIdAndDelete(templateId);

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Delete Template Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: error.message
    });
  }
};

// ==================== AGREEMENT CONTROLLERS ====================

// Generate agreement from templates

exports.generateAgreement = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { 
      termsTemplateId, 
      rulesTemplateId, 
      cancellationTemplateId,
      customTerms,
      customRules,
      customCancellation
    } = req.body;

    // Get venue owner details first
    const venueOwner = await VenueOwner.findById(req.user.id);
    if (!venueOwner) {
      return res.status(404).json({
        success: false,
        message: "Venue owner not found"
      });
    }

    // Retrieve the booking details using the bookingId
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate({
        path: 'venue',
        populate: {
          path: 'owner',
          model: 'VenueOwner'
        }
      })
      .populate('hall');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Validate that this booking belongs to the venue owner
    if (booking.venue.owner._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This booking does not belong to your venue"
      });
    }

    // Fetch payment details separately using the Payment model
    const payment = await Payment.findOne({ booking: bookingId });
    
    // Calculate deposit and balance amounts using payment data if available; otherwise default to 50% of total cost
    const depositAmount = payment ? payment.amount : (booking.pricing.total_cost * 0.5);
    const depositDueDate = payment ? payment.due_date : new Date();
    const balanceAmount = booking.pricing.total_cost - depositAmount;

    // Create new agreement.
    // Note: The 'bookingId' field will store the bookingId as a reference.
    const agreement = new Agreement({
      ownerName: venueOwner.name,
      ownerAddress: venueOwner.address || "Not provided",
      ownerContact: venueOwner.contact_number,
      consumerName: booking.user.name,
      consumerAddress: booking.user.address || "Not provided",
      consumerContact: booking.user.contact_number || "Not provided",
      venueAddress: booking.venue.location,
      eventDate: booking.event_details.date,
      eventDuration: booking.event_details.duration || "Full Day",
      eventVenue: booking.venue.name,
      totalPeople: booking.event_details.guest_count,
      pricePerPlate: booking.pricing.final_per_plate_price,
      deposit: depositAmount,
      depositDueDate: depositDueDate,
      balance: balanceAmount,
      balanceDueDate: new Date(booking.event_details.date),
      termsTemplate: termsTemplateId || null,
      rulesTemplate: rulesTemplateId || null,
      cancellationTemplate: cancellationTemplateId || null,
      customTerms: customTerms || null,
      customRules: customRules || null,
      customCancellation: customCancellation || null,
      bookingId: bookingId,  // Use bookingId field here
      venue: booking.venue._id,
      hall: booking.hall ? booking.hall._id : null
    });

    const savedAgreement = await agreement.save();

    // Optionally, update the booking with the agreement reference if desired.
    booking.agreement = savedAgreement._id;
    await booking.save();

    return res.status(201).json({
      success: true,
      agreement: savedAgreement
    });
  } catch (error) {
    console.error("Generate Agreement Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate agreement",
      error: error.message
    });
  }
};






// Create a new Agreement
exports.createAgreement = async (req, res) => {
  const user = req.user.id
  try {
    const {
      ownerName,
      ownerAddress,
      ownerContact,
      consumerName,
      consumerAddress,
      consumerContact,
      venueAddress,
      eventDate,
      eventDuration,
      eventVenue,
      totalPeople,
      pricePerPlate,
      deposit,
      depositDueDate,
      balance,
      balanceDueDate,
      refundPolicy,
      rules,
      cancellationPolicy,
      liability,
      forceMajeure,
      otherProvisions,
      signatureData,
      booking, // Optional: Reference to a Booking
    } = req.body;

    // Default agreement overview text if rules is not provided.
    const defaultRules = `This Agreement is made between the Party Palace Owner and the Consumer for the rental of the party hall located at ${venueAddress}.`;
    const agreementRules = rules && rules.trim().length > 0 ? rules : defaultRules;

    const newAgreement = new Agreement({
      ownerName,
      ownerAddress,
      ownerContact,
      consumerName,
      consumerAddress,
      consumerContact,
      venueAddress,
      eventDate,
      eventDuration,
      eventVenue,
      totalPeople,
      pricePerPlate,
      deposit,
      depositDueDate,
      balance,
      balanceDueDate,
      refundPolicy,
      rules: agreementRules,
      cancellationPolicy,
      liability,
      forceMajeure,
      otherProvisions,
      signatureData,
      booking,
    });

    const savedAgreement = await newAgreement.save();
    return res.status(201).json({ agreement: savedAgreement });
  } catch (error) {
    console.error("Create Agreement Error:", error);
    return res.status(500).json({ message: "Failed to create agreement", error: error.message });
  }
};

// Update an existing Agreement
exports.updateAgreement = async (req, res) => {
  try {
    const agreementId = req.params.id;
    const updateData = req.body;
    // Optionally: if rules is not provided, keep the existing rules
    const updatedAgreement = await Agreement.findByIdAndUpdate(agreementId, updateData, { new: true });
    return res.status(200).json({ agreement: updatedAgreement });
  } catch (error) {
    console.error("Update Agreement Error:", error);
    return res.status(500).json({ message: "Failed to update agreement", error: error.message });
  }
};

// Delete (or soft delete) an Agreement
exports.deleteAgreement = async (req, res) => {
  try {
    const agreementId = req.params.id;
    // For soft delete, you might update a flag like isDeleted, but here we hard-delete.
    await Agreement.findByIdAndDelete(agreementId);
    return res.status(200).json({ message: "Agreement deleted successfully" });
  } catch (error) {
    console.error("Delete Agreement Error:", error);
    return res.status(500).json({ message: "Failed to delete agreement", error: error.message });
  }
};

// Get a single Agreement by ID
exports.getAgreement = async (req, res) => {
  try {
    const agreementId = req.params.id;
    const agreement = await Agreement.findById(agreementId);
    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }
    return res.status(200).json({ agreement });
  } catch (error) {
    console.error("Get Agreement Error:", error);
    return res.status(500).json({ message: "Failed to get agreement", error: error.message });
  }
};

// Get all Agreements with optional filtering (by booking period, status, etc.)
exports.getAgreements = async (req, res) => {
  try {
    // Example query parameters: period (Past, Current, Future) and status (Pending, Accepted, etc.)
    const { period, status } = req.query;
    const filter = { };
    if (period) filter.booking_period = period;
    if (status) filter.status = status;
    // Sort by event date ascending
    const agreements = await Agreement.find(filter).sort({ eventDate: 1 });
    return res.status(200).json({ agreements });
  } catch (error) {
    console.error("Get Agreements Error:", error);
    return res.status(500).json({ message: "Failed to fetch agreements", error: error.message });
  }
};

// Get a single Agreement Template
exports.getTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await AgreementTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    return res.status(200).json({ template });
  } catch (error) {
    console.error("Get Template Error:", error);
    return res.status(500).json({ message: "Failed to get template", error: error.message });
  }
};

// Get all Agreement Templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await AgreementTemplate.find().sort({ created_at: -1 });
    return res.status(200).json({ templates });
  } catch (error) {
    console.error("Get Templates Error:", error);
    return res.status(500).json({ message: "Failed to fetch templates", error: error.message });
  }
};
