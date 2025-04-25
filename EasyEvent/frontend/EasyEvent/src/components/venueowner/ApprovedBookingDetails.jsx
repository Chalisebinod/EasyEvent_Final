import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaFileContract,
  FaSignature,
} from 'react-icons/fa';
import VenueSidebar from './VenueSidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// STEP TITLES
const steps = ['Set Payment Details', 'Generate Agreement', 'Add Signature'];

// Create an Axios instance with interceptor
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor to always attach the latest token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Quill modules configuration
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

function ApprovedBookingDetails() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  // BASIC STATE
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dueDateError, setDueDateError] = useState("");
  // STEP MANAGEMENT
  const [activeStep, setActiveStep] = useState(0);

  // PAYMENT DETAILS STATE
  const [paymentDetails, setPaymentDetails] = useState({
    advanceAmount: '',
    dueDate: '',
    paymentInstructions: '',
  });
  const [paymentExists, setPaymentExists] = useState(false);

  // AGREEMENT STATE
  const [agreement, setAgreement] = useState({
    terms: '',
    venueRules: '',
    cancellationPolicy: '',
  });

  // SIGNATURE STATE
  const [ownerSignature, setOwnerSignature] = useState(null);
  const [submittingSignature, setSubmittingSignature] = useState(false);

  // TEMPLATES
  const [templates, setTemplates] = useState({
    terms: [],
    rules: [],
    cancellation: [],
  });
  const [selectedTemplates, setSelectedTemplates] = useState({
    terms: '',
    rules: '',
    cancellation: '',
  });

  // FETCH BOOKING & TEMPLATES ON MOUNT
  useEffect(() => {
    fetchBookingDetails();
    fetchTemplates();
  }, [bookingId]);

  // GET BOOKING DETAILS
  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(`/api/booking/approved/details/${bookingId}`);
      if (response.data && response.data.booking) {
        const bookingData = response.data.booking;
        setBooking(bookingData);

        // Check if payment details exist
        if (bookingData.payment_details) {
          setPaymentExists(true);
          setPaymentDetails({
            advanceAmount: bookingData.payment_details.advance_amount || '',
            dueDate: bookingData.payment_details.due_date?.split('T')[0] || '',
            paymentInstructions: bookingData.payment_details.instructions || '',
          });

          // Step logic
          if (bookingData.agreement) {
            if (bookingData.agreement.owner_signature) {
              setActiveStep(2); // Already have signature
            } else {
              setActiveStep(1); // Move to agreement step
            }
          } else {
            setActiveStep(1); // Move to agreement step
          }
        } else {
          setPaymentExists(false);
          setActiveStep(0); // Payment details step
        }
      } else {
        throw new Error('Invalid response format');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to fetch booking details'
      );
      setLoading(false);
    }
  };

  // GET TEMPLATES
  const fetchTemplates = async () => {
    try {
      const venueId = localStorage.getItem('venueId');
      const response = await axiosInstance.get(`/api/booking/templates/${venueId}`);

      if (response.data.success) {
        // Separate templates by type
        const sortedTemplates = {
          terms: response.data.templates.filter((t) => t.type === 'terms'),
          rules: response.data.templates.filter((t) => t.type === 'rules'),
          cancellation: response.data.templates.filter((t) => t.type === 'cancellation'),
        };
        setTemplates(sortedTemplates);

        // Automatically select default templates
        const defaultTemplates = {
          terms: sortedTemplates.terms.find((t) => t.isDefault)?._id || '',
          rules: sortedTemplates.rules.find((t) => t.isDefault)?._id || '',
          cancellation: sortedTemplates.cancellation.find((t) => t.isDefault)?._id || '',
        };
        setSelectedTemplates(defaultTemplates);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch templates');
    }
  };

  // HANDLE PAYMENT SUBMIT
  const handlePaymentDetailsSubmit = async () => {
    try {
      // Validate the minimum advance payment amount
      if (parseFloat(paymentDetails.advanceAmount) < 800) {
        toast.error("Advance payment must be at least 800.");
        return;
      }
  
      // If already set, skip
      if (paymentExists) {
        setActiveStep(1);
        return;
      }
  
      const response = await axiosInstance.post(
        `/api/booking/payment-details/${bookingId}`,
        {
          advanceAmount: parseFloat(paymentDetails.advanceAmount),
          dueDate: paymentDetails.dueDate,
          paymentInstructions: paymentDetails.paymentInstructions,
          sendEmail: false,
        }
      );
  
      if (response.data.success) {
        setPaymentExists(true);
        toast.success("Payment details saved successfully");
        await fetchBookingDetails();
        setActiveStep(1);
      } else {
        throw new Error(response.data.message || "Failed to save payment details");
      }
    } catch (err) {
      console.error("Error saving payment details:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to save payment details"
      );
    }
  };

  // HANDLE AGREEMENT GENERATION
  const handleAgreementGeneration = async () => {
    try {
      // Gather template data using selected templates only
      const agreementData = {
        termsTemplateId: selectedTemplates.terms,
        rulesTemplateId: selectedTemplates.rules,
        cancellationTemplateId: selectedTemplates.cancellation,
      };

      const response = await axiosInstance.post(
        `/api/booking/generate-agreement/${bookingId}`,
        agreementData
      );

      if (response.data.success) {
        toast.success('Agreement generated successfully');
        setActiveStep(2);
      } else {
        throw new Error(response.data.message || 'Failed to generate agreement');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate agreement');
      console.error('Agreement generation error:', err.response?.data || err);
    }
  };

  // HANDLE SIGNATURE UPLOAD
  const handleSignatureUpload = async () => {
    try {
      setSubmittingSignature(true);
      const formData = new FormData();
      formData.append('signature', ownerSignature);
      formData.append('sendFinalEmail', 'true');

      const response = await axiosInstance.put(
        `/api/booking/owner-signature/${bookingId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        toast.success('Process completed! Final confirmation email sent to user');
        setTimeout(() => navigate('/venue-owner-dashboard'), 2000);
      } else {
        throw new Error(response.data.message || 'Failed to complete the process');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete the process');
      console.error('Final submission error:', err);
    } finally {
      setSubmittingSignature(false);
    }
  };

  // TEMPLATE SELECT
  const handleTemplateSelect = (type, templateId) => {
    setSelectedTemplates((prev) => ({ ...prev, [type]: templateId }));

    // Find the selected template and update agreement preview
    const template = templates[type].find((t) => t._id === templateId);
    if (template) {
      setAgreement((prev) => ({
        ...prev,
        [type === 'terms'
          ? 'terms'
          : type === 'rules'
          ? 'venueRules'
          : 'cancellationPolicy']: template.content,
      }));
    }
  };

  // RENDER TEMPLATE SECTION (using only default template selection)
  const renderTemplateSection = (type, label) => {
    return (
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>{label}</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select {label} Template</InputLabel>
            <Select
              value={selectedTemplates[type]}
              onChange={(e) => handleTemplateSelect(type, e.target.value)}
              label={`Select ${label} Template`}
            >
              {templates[type]?.map((template) => (
                <MenuItem key={template._id} value={template._id}>
                  {template.title} {template.isDefault && '(Default)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedTemplates[type] && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview:
              </Typography>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    templates[type]?.find((t) => t._id === selectedTemplates[type])?.content ||
                    '',
                }}
              />
            </Box>
          )}
        </Paper>
      </Grid>
    );
  };

  // LOADING STATE
  if (loading) {
    return (
      <Box display="flex" minHeight="100vh">
        <VenueSidebar />
        <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <Box display="flex" minHeight="100vh">
        <VenueSidebar />
        <Box flexGrow={1} p={3}>
          <Alert severity="error">{error}</Alert>
          <Button onClick={() => navigate('/venue-owner/bookings')} sx={{ mt: 2 }}>
            Back to Bookings
          </Button>
        </Box>
      </Box>
    );
  }

  // MAIN RENDER
  return (
    <Box display="flex" minHeight="100vh" bgcolor="background.default">
      <VenueSidebar />
      <Box flexGrow={1} p={3}>
        <ToastContainer />
        <Container maxWidth="lg">
          {/* Header */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Approved Booking Details
            </Typography>
            <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Booking Information */}
          <Grid container spacing={3}>
            {/* Customer Details */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <FaUser style={{ marginRight: '8px' }} />
                  Customer Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {booking && (
                  <>
                    <Typography>
                      <strong>Name:</strong> {booking.user.name}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {booking.user.email}
                    </Typography>
                    <Typography>
                      <strong>Contact:</strong> {booking.user.contact_number}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Event Details */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <FaCalendarAlt style={{ marginRight: '8px' }} />
                  Event Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {booking && (
                  <>
                    <Typography>
                      <strong>Event Type:</strong> {booking.event_details.event_type}
                    </Typography>
                    <Typography>
                      <strong>Date:</strong>{' '}
                      {new Date(booking.event_details.date).toLocaleDateString()}
                    </Typography>
                    <Typography>
                      <strong>Guest Count:</strong> {booking.event_details.guest_count}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Pricing Summary */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <FaMoneyBillWave style={{ marginRight: '8px' }} />
                  Pricing Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {booking?.pricing_summary && (
                  <Grid container spacing={3}>
                    {/* Per Plate Pricing */}
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          Per Plate Pricing
                        </Typography>
                        <Typography>
                          <strong>Original:</strong> Rs.
                          {booking.pricing_summary.per_plate_details.original}
                        </Typography>
                        <Typography>
                          <strong>User Offered:</strong> Rs.
                          {booking.pricing_summary.per_plate_details.user_offered}
                        </Typography>
                        <Typography>
                          <strong>Final:</strong> Rs.
                          {booking.pricing_summary.per_plate_details.final}
                        </Typography>
                        <Typography sx={{ mt: 1 }}>
                          <strong>Guest Count:</strong> {booking.pricing_summary.guest_count}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Cost Breakdown */}
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          Cost Breakdown
                        </Typography>
                        <Typography>
                          <strong>Food Cost:</strong> Rs.
                          {booking.pricing_summary.total_food_cost}
                        </Typography>
                        <Typography>
                          <strong>Additional Services:</strong> Rs.
                          {booking.pricing_summary.additional_services_cost}
                        </Typography>
                        <Typography sx={{ mt: 1, color: 'primary.main' }}>
                          <strong>Total Cost:</strong> Rs.
                          {booking.pricing_summary.total_cost}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Payment Status */}
                    <Grid item xs={12} md={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor:
                            booking.pricing_summary.payment_status === 'Paid'
                              ? '#e8f5e9'
                              : '#fff3e0',
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                          Payment Status
                        </Typography>
                        <Typography>
                          <strong>Status:</strong> {booking.pricing_summary.payment_status}
                        </Typography>
                        <Typography>
                          <strong>Advance amount :</strong> Rs.
                          {booking.pricing_summary.amount_paid}
                        </Typography>
                        <Typography
                          sx={{
                            color:
                              booking.pricing_summary.balance_amount > 0
                                ? 'error.main'
                                : 'success.main',
                          }}
                        >
                          <strong>Balance:</strong> Rs.
                          {booking.pricing_summary.balance_amount}
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Selected Foods */}
                    {booking.selected_foods && booking.selected_foods.length > 0 && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            Selected Foods
                          </Typography>
                          <Grid container spacing={2}>
                            {booking.selected_foods.map((food) => (
                              <Grid item xs={12} sm={6} md={4} key={food._id}>
                                <Typography>
                                  {food.name} - Rs.{food.price}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </Grid>
                    )}

                    {/* Additional Services */}
                    {booking.additional_services && booking.additional_services.length > 0 && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            Additional Services
                          </Typography>
                          <Grid container spacing={2}>
                            {booking.additional_services.map((service, index) => (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Typography>
                                  {service.name} - Rs.{service.price || 0}
                                </Typography>
                                {service.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {service.description}
                                  </Typography>
                                )}
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Paper>
            </Grid>

            {/* Payment Details Form */}
            {activeStep === 0 && (
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <FaMoneyBillWave style={{ marginRight: '8px' }} />
                    Set Payment Details
                  </Typography>
                  {paymentExists ? (
                    <>
                      <Alert
                        severity={
                          booking?.payment_details?.payment_status === 'Pending'
                            ? 'warning'
                            : 'info'
                        }
                        sx={{ mb: 2 }}
                      >
                        {booking?.payment_details?.payment_status === 'Pending' ? (
                          <>
                            <strong>Payment Pending:</strong> Advance payment of Rs.
                            {paymentDetails.advanceAmount} is required by{' '}
                            {new Date(paymentDetails.dueDate).toLocaleDateString()}
                          </>
                        ) : (
                          <>
                            Payment details have been set. Payment status:{' '}
                            {booking?.payment_details?.payment_status}
                          </>
                        )}
                      </Alert>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography>
                            <strong>Required Advance Amount:</strong> Rs.
                            {paymentDetails.advanceAmount}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography>
                            <strong>Due Date:</strong>{' '}
                            {new Date(paymentDetails.dueDate).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography>
                            <strong>Payment Instructions:</strong>
                          </Typography>
                          <Typography>{paymentDetails.paymentInstructions}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography>
                            <strong>Payment Status:</strong>{' '}
                            {booking?.payment_details?.payment_status}
                          </Typography>
                          {booking?.payment_details?.paid_at && (
                            <Typography>
                              <strong>Paid At:</strong>{' '}
                              {new Date(booking.payment_details.paid_at).toLocaleString()}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={() => setActiveStep(1)}>
                          Continue to Agreement
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Required Advance Amount"
                            type="number"
                            value={paymentDetails.advanceAmount}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                advanceAmount: e.target.value,
                              })
                            }
                            helperText="This amount will be required from the user to confirm the booking"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
  <TextField
    fullWidth
    label="Due Date"
    type="date"
    value={paymentDetails.dueDate}
    onChange={(e) => {
      const selectedDate = new Date(e.target.value);
      const bookingDate = new Date(booking.event_details.date);

      // Check if the due date is earlier than the booking date
      if (selectedDate < bookingDate) {
        setDueDateError("Due date cannot be earlier than the booking date.");
        return;
      } else {
        setDueDateError(""); // Clear error if valid
      }

      setPaymentDetails({
        ...paymentDetails,
        dueDate: e.target.value,
      });
    }}
    InputLabelProps={{ shrink: true }}
    error={!!dueDateError}
    helperText={dueDateError || "Deadline for the advance payment"}
  />
</Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Payment Instructions"
                            value={paymentDetails.paymentInstructions}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                paymentInstructions: e.target.value,
                              })
                            }
                            helperText="Provide clear instructions for making the payment"
                          />
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          onClick={handlePaymentDetailsSubmit}
                          disabled={!paymentDetails.advanceAmount || !paymentDetails.dueDate}
                        >
                          Set Required Payment & Continue
                        </Button>
                      </Box>
                    </>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Agreement Generation */}
            {activeStep === 1 && (
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <FaFileContract style={{ marginRight: '8px' }} />
                    Generate Agreement
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {renderTemplateSection('terms', 'Terms & Conditions')}
                    {renderTemplateSection('rules', 'Venue Rules')}
                    {renderTemplateSection('cancellation', 'Cancellation Policy')}
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleAgreementGeneration}
                      disabled={
                        !(
                          selectedTemplates.terms &&
                          selectedTemplates.rules &&
                          selectedTemplates.cancellation
                        )
                      }
                    >
                      Generate & Continue
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Signature Upload */}
            {activeStep === 2 && (
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <FaSignature style={{ marginRight: '8px' }} />
                    Add Your Signature
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setOwnerSignature(e.target.files[0])}
                      style={{ display: 'none' }}
                      id="signature-upload"
                    />
                    <label htmlFor="signature-upload">
                      <Button variant="outlined" component="span" startIcon={<FaSignature />}>
                        Upload Signature Image
                      </Button>
                    </label>
                    {ownerSignature && (
                      <Typography sx={{ mt: 2 }}>
                        Signature file selected: {ownerSignature.name}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
  variant="contained"
  onClick={handleSignatureUpload}
  disabled={!ownerSignature || submittingSignature}
  startIcon={
    submittingSignature && (
      <CircularProgress size={20} color="inherit" />
    )
  }
>
  {submittingSignature ? "Submitting..." : "Upload & Send to User"}
</Button>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default ApprovedBookingDetails;
