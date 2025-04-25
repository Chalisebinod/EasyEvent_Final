import { useState, useEffect } from "react";
import {
  Container,
  TextField,
  MenuItem,
  Button,
  Typography,
  Box,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api"; // Change this to your backend URL

export default function EventBookingForm() {
  const [venues, setVenues] = useState([]);
  const [halls, setHalls] = useState([]);
  const [formData, setFormData] = useState({
    event_type: "",
    guest_count: "",
    date: "",
    selected_venue: "",
    selected_hall: "",
    selected_foods: [],
    original_per_plate_price: "",
    user_offered_per_plate_price: "",
  });

  const foodOptions = ["Veg", "Non-Veg", "Vegan", "Seafood", "Buffet"];

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/venues`)
      .then((res) => setVenues(res.data))
      .catch((error) => console.error("Error fetching venues:", error));
  }, []);

  useEffect(() => {
    if (formData.selected_venue) {
      axios
        .get(`${API_BASE_URL}/venues/${formData.selected_venue}/halls`)
        .then((res) => setHalls(res.data))
        .catch((error) => console.error("Error fetching halls:", error));
    } else {
      setHalls([]);
    }
  }, [formData.selected_venue]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFoodSelection = (e) => {
    setFormData({ ...formData, selected_foods: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.event_type ||
      !formData.guest_count ||
      !formData.date ||
      !formData.selected_venue ||
      !formData.selected_hall ||
      !formData.original_per_plate_price ||
      !formData.user_offered_per_plate_price
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const bookingData = {
        venue: formData.selected_venue,
        hall: formData.selected_hall,
        event_details: {
          event_type: formData.event_type,
          guest_count: formData.guest_count,
          date: formData.date,
        },
        selected_foods: formData.selected_foods,
        pricing: {
          original_per_plate_price: formData.original_per_plate_price,
          user_offered_per_plate_price: formData.user_offered_per_plate_price,
          final_per_plate_price: formData.user_offered_per_plate_price, // Assuming final price is user-offered
        },
      };

      await axios.post(`${API_BASE_URL}/book-event`, bookingData);
      alert("Booking Successful!");
      setFormData({
        event_type: "",
        guest_count: "",
        date: "",
        selected_venue: "",
        selected_hall: "",
        selected_foods: [],
        original_per_plate_price: "",
        user_offered_per_plate_price: "",
      });
    } catch (error) {
      console.error("Error booking event:", error);
      alert("Failed to book event");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{ p: 4, bgcolor: "white", borderRadius: 3, boxShadow: 3, mt: 5 }}
      >
        <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
          Event Booking Form
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Event Type"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="number"
            label="Number of Guests"
            name="guest_count"
            value={formData.guest_count}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="date"
            label="Event Date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Venue</InputLabel>
            <Select
              name="selected_venue"
              value={formData.selected_venue}
              onChange={handleChange}
              required
            >
              {venues.map((venue) => (
                <MenuItem key={venue._id} value={venue._id}>
                  {venue.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            margin="normal"
            disabled={!formData.selected_venue}
          >
            <InputLabel>Hall</InputLabel>
            <Select
              name="selected_hall"
              value={formData.selected_hall}
              onChange={handleChange}
              required
            >
              {halls.map((hall) => (
                <MenuItem key={hall._id} value={hall._id}>
                  {hall.name} (Capacity: {hall.capacity})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Food Selection</InputLabel>
            <Select
              multiple
              value={formData.selected_foods}
              onChange={handleFoodSelection}
            >
              {foodOptions.map((food) => (
                <MenuItem key={food} value={food}>
                  {food}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label="Original Price per Plate"
            name="original_per_plate_price"
            value={formData.original_per_plate_price}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            type="number"
            label="User Offered Price per Plate"
            name="user_offered_per_plate_price"
            value={formData.user_offered_per_plate_price}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            sx={{ mt: 2 }}
          >
            Submit Booking
          </Button>
        </form>
      </Box>
    </Container>
  );
}
