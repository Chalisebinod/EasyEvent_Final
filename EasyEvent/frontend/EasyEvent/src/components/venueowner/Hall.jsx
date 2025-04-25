import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Badge,
  Grid,
  Tooltip,
  Paper,
  Container,
  Fab,
  FormControl,
  FormGroup,
  LinearProgress,
  TextField,
  InputAdornment,
  OutlinedInput,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Edit,
  Delete,
  People,
  AttachMoney,
  Restaurant,
  Stars,
  Close,
  MeetingRoom,
  AddPhotoAlternate,
  Check,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VenueSidebar from "./VenueSidebar";
import FoodPicker from "./food/FoodPicker";

// Styled components for hall card layout
const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 16px 32px rgba(0,0,0,0.16)",
  },
}));

const CardOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  background:
    "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)",
  zIndex: 1,
}));

const HallAvailabilityBadge = styled(Badge)(({ theme, available }) => ({
  position: "absolute",
  top: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 2,
  "& .MuiBadge-badge": {
    backgroundColor: available
      ? theme.palette.success.main
      : theme.palette.error.main,
    color: theme.palette.common.white,
    fontSize: 12,
    height: 24,
    padding: theme.spacing(0, 1),
    borderRadius: 12,
  },
}));

const FeatureChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

const CardFooter = styled(CardActions)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  borderTop: `1px solid ${theme.palette.grey[200]}`,
  padding: theme.spacing(1, 2),
}));

const HallStatusSwitch = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(3),
  boxShadow: theme.shadows[1],
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  background: "linear-gradient(45deg, #4F46E5, #3B82F6)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(2),
  },
}));

// HallCard Component
const HallCard = ({ hall, onEdit, onDelete, onToggleAvailability }) => {
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [pendingAvailability, setPendingAvailability] = useState(null);

  const handleToggleClick = (event) => {
    event.stopPropagation();
    setPendingAvailability(event.target.checked);
    setToggleDialogOpen(true);
  };

  const handleConfirmToggle = () => {
    onToggleAvailability(hall._id, pendingAvailability);
    setToggleDialogOpen(false);
  };

  const coverImage =
    hall.images && hall.images.length > 0
      ? `http://localhost:8000/${hall.images[0].replace(/\\/g, "/")}`
      : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop";

  const price = hall.pricePerPlate || hall.basePricePerPlate;

  return (
    <>
      <StyledCard>
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            height="220"
            image={coverImage}
            alt={hall.name}
            sx={{ objectFit: "cover" }}
          />
          <CardOverlay />
          <HallAvailabilityBadge
            badgeContent={hall.isAvailable ? "Available" : "Unavailable"}
            available={hall.isAvailable ? 1 : 0}
            overlap="rectangular"
          />

          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              zIndex: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "white",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {hall.name}
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <DetailItem>
                <People sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="body1" fontWeight="medium">
                  {hall.capacity} Guests
                </Typography>
              </DetailItem>
            </Grid>
            <Grid item xs={6}>
              <DetailItem>
                <AttachMoney sx={{ mr: 1, color: "success.main" }} />
                <Typography variant="body1" fontWeight="medium">
                  Rs.{price}/plate
                </Typography>
              </DetailItem>
            </Grid>
          </Grid>
          {hall.features && hall.features.length > 0 && (
            <Box mt={2}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Features:
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  p: 1,
                  backgroundColor: "grey.50",
                  borderRadius: 2,
                }}
              >
                {hall.features.map((feat, idx) => (
                  <FeatureChip
                    key={idx}
                    label={feat}
                    size="small"
                    icon={<Stars fontSize="small" />}
                  />
                ))}
              </Paper>
            </Box>
          )}
          {hall.includedFood && hall.includedFood.length > 0 && (
            <Box mt={2}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Included Food:
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  p: 1,
                  backgroundColor: "grey.50",
                  borderRadius: 2,
                }}
              >
                {hall.includedFood.map((food, idx) => (
                  <FeatureChip
                    key={idx}
                    label={food.name}
                    size="small"
                    icon={<Restaurant fontSize="small" />}
                  />
                ))}
              </Paper>
            </Box>
          )}
        </CardContent>
        <CardFooter>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Box sx={{ display: "flex" }}>
                <Tooltip title="Edit Hall">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(hall)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Hall">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(hall)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item>
              <HallStatusSwitch>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  {hall.isAvailable ? "Active" : "Inactive"}
                </Typography>
                <Switch
                  size="small"
                  checked={hall.isAvailable}
                  onChange={handleToggleClick}
                  color="primary"
                />
              </HallStatusSwitch>
            </Grid>
          </Grid>
        </CardFooter>
      </StyledCard>

      <Dialog
        open={toggleDialogOpen}
        onClose={() => setToggleDialogOpen(false)}
      >
        <DialogTitle>
          {pendingAvailability ? "Activate Hall" : "Deactivate Hall"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to change the status of "{hall.name}" to{" "}
            {pendingAvailability ? "Available" : "Unavailable"}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setToggleDialogOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmToggle}
            variant="contained"
            color={pendingAvailability ? "success" : "error"}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Main Hall Management Component
const Hall = () => {
  const [venue, setVenue] = useState(null);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal and selected hall states for create, edit, delete, toggle actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleHall, setToggleHall] = useState(null);
  const [pendingAvailability, setPendingAvailability] = useState(null);

  // Form states for new hall creation and editing
  const [newHall, setNewHall] = useState({
    name: "",
    capacity: "",
    basePricePerPlate: "",
    includedFood: [],
    features: [],
    images: [],
    isAvailable: false,
  });
  const [editHall, setEditHall] = useState({
    name: "",
    capacity: "",
    basePricePerPlate: "",
    includedFood: [],
    features: [],
    isAvailable: false,
  });
  const [customFeature, setCustomFeature] = useState("");

  const accessToken = localStorage.getItem("access_token");

  // Predefined features used in the checkbox list.
  const defaultFeatures = ["AC", "Projector", "Stage", "Catering", "Parking"];

  // Fetch venue profile
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:8000/api/venueOwner/profile",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (res.data.venue) {
          setVenue(res.data.venue);
          localStorage.setItem("venueID", res.data.venue._id);
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchVenue();
  }, [accessToken]);

  // Fetch halls
  useEffect(() => {
    const venueId = localStorage.getItem("venueID");
    if (!venueId) return;
    const fetchHalls = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/halls/${venueId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setHalls(res.data.halls);
      } catch (err) {
        // toast.error(err.response?.data?.message || err.message);
      }
    };
    fetchHalls();
  }, [venue, accessToken]);

  // Handlers for edit, delete, toggle actions
  const handleEditClick = (hall) => {
    setSelectedHall(hall);
    setEditHall({
      name: hall.name,
      capacity: hall.capacity,
      basePricePerPlate: hall.basePricePerPlate,
      includedFood: hall.includedFood || [],
      features: hall.features || [],
      isAvailable: hall.isAvailable,
    });
    setEditModalOpen(true);
  };

  const handleDeleteClick = (hall) => {
    setSelectedHall(hall);
    setDeleteModalOpen(true);
  };

  const handleAvailabilityToggle = async (hallId, newStatus) => {
    try {
      await handleEditHall(hallId, { availability: newStatus });
      toast.success("Hall status updated successfully!");
    } catch (err) {
      toast.error("Failed to update hall status.");
    }
  };

  // Create hall handler
  const handleAddHall = async () => {
    try {
      const venueId = localStorage.getItem("venueID");
      const formData = new FormData();
      formData.append("name", newHall.name);
      formData.append("capacity", newHall.capacity);
      formData.append("basePricePerPlate", newHall.basePricePerPlate);
      formData.append("isAvailable", newHall.isAvailable);
      formData.append("venue", venueId);
      if (newHall.includedFood && newHall.includedFood.length > 0) {
        newHall.includedFood.forEach((foodId) =>
          formData.append("includedFood", foodId)
        );
      }
      newHall.features.forEach((feat) => formData.append("features", feat));
      if (newHall.images.length > 0) {
        newHall.images.forEach((image) => formData.append("images", image));
      }
      const response = await axios.post(
        "http://localhost:8000/api/halls",
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setHalls([...halls, response.data.hall]);
      toast.success("Hall added successfully!");
      setIsModalOpen(false);
      setNewHall({
        name: "",
        capacity: "",
        basePricePerPlate: "",
        includedFood: [],
        features: [],
        images: [],
        isAvailable: false,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add hall.");
    }
  };

  const handleEditHall = async (hallId, updatedData) => {
    try {
      if (updatedData.pricePerPlate) {
        updatedData.basePricePerPlate = updatedData.pricePerPlate;
        delete updatedData.pricePerPlate;
      }
      if (updatedData.availability !== undefined) {
        updatedData.isAvailable = updatedData.availability;
        delete updatedData.availability;
      }
      const response = await axios.patch(
        `http://localhost:8000/api/halls/${hallId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setHalls(
        halls.map((hall) => (hall._id === hallId ? response.data.hall : hall))
      );
      // toast.success("Hall updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update hall.");
    }
  };

  const handleDeleteHall = async (hallId) => {
    try {
      await axios.delete(`http://localhost:8000/api/halls/${hallId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setHalls(halls.filter((hall) => hall._id !== hallId));
      toast.success("Hall deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete hall.");
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    files.forEach((file) => {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.warning("Only JPG or PNG images are allowed");
      } else {
        validFiles.push(file);
      }
    });

    if (newHall.images.length + validFiles.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }

    setNewHall({
      ...newHall,
      images: [...newHall.images, ...validFiles],
    });
  };

  const removeImage = (index) => {
    setNewHall({
      ...newHall,
      images: newHall.images.filter((_, i) => i !== index),
    });
  };

  // Fix: After clicking "Add" for a custom feature, the feature now remains visible.
  const handleAddCustomFeature = () => {
    if (!customFeature.trim()) return;
    setNewHall({
      ...newHall,
      features: [...newHall.features, customFeature.trim()],
    });
    setCustomFeature("");
  };

  return (
    <Box display="flex" minHeight="100vh" bgcolor="white">
      <ToastContainer position="top-center" autoClose={3000} />
      <VenueSidebar />
      <Box flexGrow={1} p={2}>
        <Container maxWidth="xl">
          <HeaderBox>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#fff" }}
              >
                Hall Management
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ color: "orange", fontSize: "1.5rem" }}
              >
                {venue?.name || "Your Venue"}
              </Typography>
            </Box>
            <Fab
              variant="extended"
              color="primary"
              onClick={() => setIsModalOpen(true)}
            >
              <MeetingRoom sx={{ mr: 1 }} />
              Add New Hall
            </Fab>
          </HeaderBox>

          {loading ? (
            <LinearProgress color="secondary" />
          ) : error ? (
            <Box
              p={2}
              bgcolor="error.light"
              color="error.contrastText"
              borderRadius={1}
            >
              {error}
            </Box>
          ) : !venue ? (
            <Box textAlign="center" p={4} color="grey.600">
              No venue created yet.
            </Box>
          ) : (
            <Grid container spacing={3}>
              {halls.map((hall) => (
                <Grid item xs={12} sm={6} md={4} key={hall._id}>
                  <HallCard
                    hall={hall}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onToggleAvailability={handleAvailabilityToggle}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>

        {/* Create Hall Dialog with dim background */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fullWidth
          maxWidth="md"
          scroll="paper"
          BackdropProps={{
            style: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(to right, #4F46E5, #3B82F6)",
              color: "#fff",
            }}
          >
            <span>Create New Hall</span>
            <IconButton onClick={() => setIsModalOpen(false)} color="inherit">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Hall Name"
                  fullWidth
                  variant="outlined"
                  value={newHall.name}
                  onChange={(e) =>
                    setNewHall({ ...newHall, name: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Capacity"
                      type="number"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">people</InputAdornment>
                        ),
                      }}
                      value={newHall.capacity}
                      onChange={(e) =>
                        setNewHall({ ...newHall, capacity: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Base Price Per Plate"
                      type="number"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">Rs.</InputAdornment>
                        ),
                      }}
                      value={newHall.basePricePerPlate}
                      onChange={(e) =>
                        setNewHall({
                          ...newHall,
                          basePricePerPlate: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    Select Included Foods:
                  </Typography>
                  <FoodPicker
                    onSelectionChange={(selected) =>
                      setNewHall({ ...newHall, includedFood: selected })
                    }
                  />
                </Box>

                <FormControl component="fieldset" sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    Features
                  </Typography>
                  <FormGroup row>
                    {defaultFeatures.map((feature) => (
                      <FormControlLabel
                        key={feature}
                        control={
                          <Checkbox
                            checked={newHall.features.includes(feature)}
                            onChange={(e) => {
                              const features = [...newHall.features];
                              if (e.target.checked) features.push(feature);
                              else {
                                const idx = features.indexOf(feature);
                                features.splice(idx, 1);
                              }
                              setNewHall({ ...newHall, features });
                            }}
                            color="primary"
                          />
                        }
                        label={feature}
                      />
                    ))}
                  </FormGroup>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TextField
                      label="Custom Feature"
                      variant="outlined"
                      size="small"
                      value={customFeature}
                      onChange={(e) => setCustomFeature(e.target.value)}
                      sx={{ mr: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCustomFeature}
                    >
                      Add
                    </Button>
                  </Box>
                  {newHall.features
                    .filter((f) => !defaultFeatures.includes(f))
                    .map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        onDelete={() =>
                          setNewHall({
                            ...newHall,
                            features: newHall.features.filter(
                              (f) => f !== feature
                            ),
                          })
                        }
                        sx={{ mt: 1, mr: 1 }}
                      />
                    ))}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <OutlinedInput
                    id="image-upload"
                    type="file"
                    inputProps={{ multiple: true, accept: ".jpg,.jpeg,.png" }}
                    onChange={handleImageUpload}
                    startAdornment={
                      <InputAdornment position="start">
                        <AddPhotoAlternate color="action" />
                      </InputAdornment>
                    }
                  />
                </FormControl>
                <Box
                  sx={{
                    border: "2px dashed",
                    borderColor: "grey.300",
                    borderRadius: 1,
                    p: 2,
                    textAlign: "center",
                    minHeight: 120,
                  }}
                >
                  {newHall.images.length === 0 ? (
                    <Typography color="grey.500">No images selected</Typography>
                  ) : (
                    <Box display="flex" flexWrap="wrap" justifyContent="center">
                      {newHall.images.map((image, index) => (
                        <Box key={index} sx={{ position: "relative", m: 1 }}>
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`upload-${index}`}
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              background: "rgba(255,255,255,0.7)",
                            }}
                            onClick={() => removeImage(index)}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 1, color: "grey.500" }}
                  >
                    {5 - newHall.images.length} images remaining
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHall}
              variant="contained"
              color="primary"
              startIcon={<Check />}
            >
              Create Hall
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Hall Dialog */}
        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          fullWidth
          maxWidth="md"
          scroll="paper"
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(to right, #4F46E5, #3B82F6)",
              color: "#fff",
            }}
          >
            <span>Edit Hall</span>
            <IconButton onClick={() => setEditModalOpen(false)} color="inherit">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} mt={3}>
                <TextField
                  label="Hall Name"
                  fullWidth
                  variant="outlined"
                  value={editHall.name}
                  onChange={(e) =>
                    setEditHall({ ...editHall, name: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Capacity"
                      type="number"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">people</InputAdornment>
                        ),
                      }}
                      value={editHall.capacity}
                      onChange={(e) =>
                        setEditHall({ ...editHall, capacity: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Base Price Per Plate"
                      type="number"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">Rs.</InputAdornment>
                        ),
                      }}
                      value={editHall.basePricePerPlate}
                      onChange={(e) =>
                        setEditHall({
                          ...editHall,
                          basePricePerPlate: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>

                <FormControl component="fieldset" sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    Features
                  </Typography>
                  <FormGroup row>
                    {["AC", "Projector", "Stage", "Catering", "Parking"].map(
                      (feature) => (
                        <FormControlLabel
                          key={feature}
                          control={
                            <Checkbox
                              checked={editHall.features.includes(feature)}
                              onChange={(e) => {
                                const feats = [...editHall.features];
                                if (e.target.checked) feats.push(feature);
                                else {
                                  const idx = feats.indexOf(feature);
                                  feats.splice(idx, 1);
                                }
                                setEditHall({ ...editHall, features: feats });
                              }}
                              color="primary"
                            />
                          }
                          label={feature}
                        />
                      )
                    )}
                  </FormGroup>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setEditModalOpen(false)}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleEditHall(selectedHall._id, editHall);
                setEditModalOpen(false);
              }}
              variant="contained"
              color="primary"
              startIcon={<Check />}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the hall "{selectedHall?.name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteModalOpen(false)}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleDeleteHall(selectedHall._id);
                setDeleteModalOpen(false);
              }}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Hall;
