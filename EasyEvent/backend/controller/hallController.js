const Hall = require("../model/hallSchema");
const Food = require("../model/FoodCategorySchema")

exports.addHall = async (req, res) => {
  try {
    const { 
      venue, 
      name, 
      capacity, 
      basePricePerPlate, 
      features, 
      seating_arrangements,
      includedFood // array of Food IDs
    } = req.body;

    // Validate that venueId is present
    if (!venue) {
      return res.status(400).json({ message: "Venue ID is required." });
    }

    // If images are uploaded, add their file paths to images array
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
    }

    // Create the hall with default isAvailable set to false
    const hall = await Hall.create({
      venue,
      name,
      capacity,
      basePricePerPlate,
      includedFood: includedFood || [],
      features,
      images,
      isAvailable: false, // Default to false until manually enabled
      seating_arrangements
    });

    return res.status(201).json({ hall });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.editHall = async (req, res) => {
  try {
    const hallId = req.params.id;
    const updatedData = req.body;

    // If images are uploaded, update the images field
    if (req.files && req.files.length > 0) {
      updatedData.images = req.files.map(file => file.path);
    }

    // If client still sends "pricePerPlate", rename it to basePricePerPlate
    if (updatedData.pricePerPlate) {
      updatedData.basePricePerPlate = updatedData.pricePerPlate;
      delete updatedData.pricePerPlate;
    }

    // If client sends "availability", rename it to isAvailable
    if (updatedData.availability !== undefined) {
      updatedData.isAvailable = updatedData.availability;
      delete updatedData.availability;
    }

    // Update hall document with any changes, including includedFood and features
    const hall = await Hall.findByIdAndUpdate(hallId, updatedData, { new: true });
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }
    return res.status(200).json({ hall });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
/**
 * Book a hall by adding dates to the hall's blocked_dates array.
 * Example usage: booking a hall for a wedding on a certain date.
 */
exports.bookHall = async (req, res) => {
  try {
    // hallId can come from URL params: e.g., /bookHall/:id
    const hallId = req.params.id;
    const { dates } = req.body; 
    // 'dates' can be a single date or an array of dates

    // Make sure dates exist in the request body
    if (!dates || dates.length === 0) {
      return res.status(400).json({ message: "At least one date is required to book the hall." });
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found." });
    }

    // If 'dates' is a single date string, wrap it in an array for consistency
    const datesArray = Array.isArray(dates) ? dates : [dates];

    // Convert each date to a JS Date object and push to the hall's blocked_dates
    datesArray.forEach((dateString) => {
      const dateObj = new Date(dateString);
      // Optional check: if dateObj already in blocked_dates, skip or throw an error
      // e.g., if (hall.blocked_dates.some(d => d.getTime() === dateObj.getTime())) {...}
      hall.blocked_dates.push(dateObj);
    });

    await hall.save();

    return res.status(200).json({
      message: "Hall booked successfully.",
      hall,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Update hall availability (e.g., to false when under renovation).
 * Example usage: set hall availability to false if hall is closed for maintenance.
 */
exports.updateHallAvailability = async (req, res) => {
  try {
    // hallId can come from URL params: e.g., /updateAvailability/:id
    const hallId = req.params.id;
    const { availability } = req.body; // true or false

    if (availability === undefined) {
      return res
        .status(400)
        .json({ message: "Availability status (true/false) is required." });
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found." });
    }

    hall.availability = availability;
    await hall.save();

    return res.status(200).json({
      message: `Hall availability updated to ${availability}`,
      hall,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


  exports.deleteHall = async (req, res) => {
    try {
      const hallId = req.params.id;
      const hall = await Hall.findByIdAndDelete(hallId);
      if (!hall) {
        return res.status(404).json({ message: "Hall not found" });
      }
      return res.status(200).json({ message: "Hall deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  

  exports.getHallsWithBlockedDates = async (req, res) => {
    try {
      const venueId = req.query.venue || (req.user && req.user.venue);
      if (!venueId) {
        return res.status(400).json({ message: "Venue id is required" });
      }
      const halls = await Hall.find({ venue: venueId });
      const hallsSeparated = halls.map((hall) => {
        const { blocked_dates, ...hallDetails } = hall.toObject();
        return {
          hall: hallDetails,
          blockedDates: blocked_dates
        };
      });
      return res.status(200).json({ halls: hallsSeparated });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  

  exports.getHallsProfile = async (req, res) => {
    try {
      if (!req.user || !req.user.venue) {
        return res.status(401).json({ message: "Unauthorized: Venue information missing" });
      }
      const venueId = req.user.venue;
      const halls = await Hall.find({ venue: venueId });
      return res.status(200).json({ halls });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  exports.getHallsByVenue = async (req, res) => {
    try {
      const venueId = req.params.venueId; // Assuming venueId is passed as a route parameter
  
      if (!venueId) {
        return res.status(400).json({ message: "Venue ID is required" });
      }
  
      // Populate the includedFood field with only the 'name' field from Food
      const halls = await Hall.find({ venue: venueId }).populate("includedFood", "name");
  
      if (!halls.length) {
        return res.status(404).json({ message: "No halls found for this venue" });
      }
  
      return res.status(200).json({ halls });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };