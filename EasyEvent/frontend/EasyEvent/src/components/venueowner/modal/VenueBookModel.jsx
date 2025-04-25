import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const VenueBookModel = ({ open, onClose }) => {
  // Get the venue id and token from local storage
  const venueId = localStorage.getItem("venueID");
  const token = localStorage.getItem("access_token");

  // State for halls list and form fields
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [hallPrice, setHallPrice] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [negotiationAmount, setNegotiationAmount] = useState("");

  // Fetch halls for the venue when the modal opens
  useEffect(() => {
    if (open && venueId) {
      axios
        .get(`http://localhost:8000/api/halls/${venueId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          // Assuming the API returns an object with a "halls" array
          setHalls(res.data.halls);
        })
        .catch((err) => {
          console.error("Error fetching halls:", err);
        });
    }
  }, [open, venueId, token]);

  // When a hall is selected, auto-populate the hall price (if available)
  useEffect(() => {
    if (selectedHall && halls.length > 0) {
      const hall = halls.find((h) => h._id === selectedHall);
      if (hall) {
        // Use hall.pricePerPlate or hall.basePricePerPlate as default price
        setHallPrice(hall.pricePerPlate || hall.basePricePerPlate || "");
      }
    }
  }, [selectedHall, halls]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!selectedHall || !eventType || !eventDate || !guestCount || !hallPrice) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      venue: venueId,
      hall: selectedHall,
      event_details: {
        event_type: eventType,
        date: eventDate,
        guest_count: parseInt(guestCount, 10),
      },
      pricing: {
        hall_price: parseFloat(hallPrice),
        advance_payment: advancePayment ? parseFloat(advancePayment) : 0,
        negotiation_amount: negotiationAmount ? parseFloat(negotiationAmount) : 0,
      },
      booked_by_owner: true, // flag to indicate this booking is made by the owner
    };

    try {
      // Change the endpoint as per your backend routing
      await axios.post("http://localhost:8000/api/booking/createOwnerBooking", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Booking created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Error creating booking: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Book Venue (Owner)</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Hall Selection */}
            <Grid item xs={12}>
              <TextField
                select
                label="Select Hall"
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
                fullWidth
                required
              >
                {halls.map((hall) => (
                  <MenuItem key={hall._id} value={hall._id}>
                    {hall.name} (Capacity: {hall.capacity})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {/* Event Details */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Event Type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Guest Count"
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            {/* Pricing Adjustments */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hall Price"
                type="number"
                value={hallPrice}
                onChange={(e) => setHallPrice(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Advance Payment"
                type="number"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Negotiation Amount"
                type="number"
                value={negotiationAmount}
                onChange={(e) => setNegotiationAmount(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Book Venue
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default VenueBookModel;
