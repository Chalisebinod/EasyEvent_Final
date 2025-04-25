import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const Approve = ({ open, onClose, onConfirm }) => {
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [agreementFile, setAgreementFile] = useState(null);
  const [signature, setSignature] = useState(""); // Placeholder for an e-signature widget

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAgreementFile(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    // Pass the entered values back to the parent
    onConfirm({
      advanceAmount: parseFloat(advanceAmount),
      agreementFile,
      signature,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 4 }}>
        Approval & Agreement Details
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Advance Amount */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Enter Advance Amount (₹)
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
            placeholder="e.g., 5000"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Agreement Preview */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Agreement Preview
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: "#f9f9f9",
              maxHeight: 150,
              overflowY: "auto",
            }}
          >
            <Typography variant="body2">
              This is a preview of the agreement that will be sent to the user. It
              includes all the booking details, the advance amount, and a link
              for online payment. (Customize this text or load dynamic content.)
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Agreement Document Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Upload Agreement Document
          </Typography>
          <Button variant="outlined" component="label">
            {agreementFile ? "Change File" : "Upload File"}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {agreementFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {agreementFile.name}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* E-Signature Placeholder */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            E-Signature (Optional)
          </Typography>
          {/* Replace the below TextField with your e-signature widget integration if needed */}
          <TextField
            fullWidth
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Enter signature or sign digitally"
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          You may also use the chat for further clarifications.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm Approval
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Approve;
