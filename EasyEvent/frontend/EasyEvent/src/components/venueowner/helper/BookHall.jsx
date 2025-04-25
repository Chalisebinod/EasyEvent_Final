import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
} from "@mui/material";
import { Close, Check } from "@mui/icons-material";

const BookHall = ({ open, onClose, hallId, onBookingSuccess }) => {
  const [datesInput, setDatesInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    // Split the input by comma, trim each value, and filter out empty entries.
    const dates = datesInput
      .split(",")
      .map((date) => date.trim())
      .filter((date) => date !== "");

    if (dates.length === 0) {
      toast.error("Please enter at least one date in YYYY-MM-DD format.");
      return;
    }

    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      await axios.post(
        `http://localhost:8000/api/halls/book/${hallId}`,
        { dates },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Hall booked successfully.");
      setDatesInput("");
      if (onBookingSuccess) onBookingSuccess(); // callback to refresh data if needed
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to book the hall."
      );
    }
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        sx: {
          maxHeight: "80vh",
          mt: 8, // adjust if your header overlaps
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(to right, #7e22ce, #2563eb)",
          color: "#fff",
          py: 2,
          px: 3,
        }}
      >
        <span>Book Hall</span>
        <IconButton onClick={onClose} color="inherit">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box component="form" noValidate>
          <TextField
            label="Booking Dates"
            placeholder="YYYY-MM-DD, YYYY-MM-DD, ..."
            fullWidth
            variant="outlined"
            value={datesInput}
            onChange={(e) => setDatesInput(e.target.value)}
            helperText="Enter dates separated by commas"
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: "grey.300" }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleBook}
          variant="contained"
          color="primary"
          startIcon={<Check />}
          disabled={loading}
        >
          {loading ? "Booking..." : "Book Hall"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookHall;
