import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import { Add, Edit, Delete, Close } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VenueSidebar from "../VenueSidebar";

const FoodManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const accessToken = localStorage.getItem("access_token");
  const venueId = localStorage.getItem("venueID");

  /* ------------------ Food Items Management ------------------ */
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);

  // Fixed food categories drop down — default categories
  const fixedCategories = ["Veg", "Buff", "Chicken"];

  // Modal state for Food Item creation/editing
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({
    mealType: "starter",
    category: "",
    name: "",
    price: "",
    description: "",
    custom_options: "",
  });

  // Additional state for custom category input
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Fetch Food Items for the current venue
  const fetchFoods = async () => {
    setLoadingFoods(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/food/venue/${venueId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setFoods(response.data.foods || []);
    } catch (error) {
      // toast.error(error.response?.data?.message || "Error fetching foods");
    } finally {
      setLoadingFoods(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [accessToken, venueId]);

  const openFoodModal = (food = null) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        mealType: food.mealType,
        category: food.category,
        name: food.name,
        price: food.price,
        description: food.description || "",
        custom_options: food.custom_options ? food.custom_options.join(", ") : "",
      });
      // If the current category is not one of the fixed ones, show the custom input prefilled
      if (!fixedCategories.includes(food.category) && food.category !== "") {
        setShowCustomInput(true);
        setCustomCategory(food.category);
      } else {
        setShowCustomInput(false);
        setCustomCategory("");
      }
    } else {
      setEditingFood(null);
      setFoodForm({
        mealType: "starter",
        category: "",
        name: "",
        price: "",
        description: "",
        custom_options: "",
      });
      setShowCustomInput(false);
      setCustomCategory("");
    }
    setFoodModalOpen(true);
  };

  const closeFoodModal = () => {
    setFoodModalOpen(false);
  };

  const handleFoodFormChange = (e) => {
    const { name, value } = e.target;
    setFoodForm((prev) => ({ ...prev, [name]: value }));
  };

  // Custom handler for category select
  const handleCategoryChange = (e) => {
    const { value } = e.target;
    if (value === "custom") {
      setShowCustomInput(true);
      // Clear previous category value for fresh custom input
      setFoodForm((prev) => ({ ...prev, category: "" }));
    } else {
      setShowCustomInput(false);
      setCustomCategory("");
      setFoodForm((prev) => ({ ...prev, category: value }));
    }
  };

  const handleSaveFood = async () => {
    try {
      const payload = {
        ...foodForm,
        custom_options: foodForm.custom_options.split(",").map((s) => s.trim()),
        venue: venueId,
      };
      if (editingFood) {
        const response = await axios.patch(
          `http://localhost:8000/api/food/${editingFood._id}`,
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setFoods(
          foods.map((f) => (f._id === editingFood._id ? response.data.food : f))
        );
        toast.success("Food updated successfully!");
      } else {
        const response = await axios.post(
          "http://localhost:8000/api/food/add",
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setFoods([response.data.food, ...foods]);
        toast.success("Food created successfully!");
      }
      closeFoodModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving food");
    }
  };

  const handleDeleteFood = async (foodId) => {
    try {
      await axios.delete(`http://localhost:8000/api/food/${foodId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setFoods(foods.filter((food) => food._id !== foodId));
      toast.success("Food deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting food");
    }
  };

  // Handle tab change – here we have only one tab for Food Items
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Dialog classes for consistent styling and spacing
  const [dialogTitleClasses] = useState(
    "bg-indigo-600 text-white font-bold text-xl relative px-8 py-6"
  );
  const [dialogCloseIconClasses] = useState(
    "absolute top-5 right-5 text-white hover:text-gray-200"
  );
  const [dialogContentClasses] = useState("px-10 py-10 bg-white");
  const [dialogActionsClasses] = useState("bg-gray-100 px-8 py-6");

  return (
    <Box className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <VenueSidebar />

      {/* Main Content Area */}
      <Box className="flex-grow p-6">
        <ToastContainer position="top-center" autoClose={3000} />

        {/* Header */}
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          className="text-3xl font-extrabold text-gray-800 mb-8"
        >
          Food Management
        </Typography>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          textColor="primary"
          indicatorColor="primary"
          className="mb-8 border-b border-gray-300"
        >
          <Tab label="Food Items" className="focus:outline-none" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* CREATE FOOD Button with extra right margin */}
            <Box className="flex justify-end mb-8 mr-20">
              <Button
                variant="contained"
                color="primary"
                onClick={() => openFoodModal()}
                startIcon={<Add />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                CREATE FOOD
              </Button>
            </Box>

            {loadingFoods ? (
              <Typography align="center" className="text-gray-700">
                Loading foods...
              </Typography>
            ) : foods.length === 0 ? (
              <Typography align="center" className="text-xl text-gray-600">
                No foods found for this venue
              </Typography>
            ) : (
              <Grid container spacing={6}>
                {foods.map((food) => (
                  <Grid item xs={12} sm={6} md={4} key={food._id}>
                    <Paper className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1">
                      <Typography variant="h6" className="font-bold text-gray-800">
                        {food.name}
                      </Typography>
                      <Typography className="text-sm text-gray-500 mb-1">
                        {food.mealType.toUpperCase()} | {food.category}
                      </Typography>
                      <Typography className="text-lg font-semibold text-indigo-600">
                        Rs.{food.price}
                      </Typography>
                      {food.description && (
                        <Typography className="text-xs text-gray-500 mt-2">
                          {food.description}
                        </Typography>
                      )}
                      <Box className="mt-4 flex justify-end space-x-2">
                        <IconButton
                          onClick={() => openFoodModal(food)}
                          color="primary"
                          className="text-gray-800 hover:text-gray-600"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteFood(food._id)}
                          color="error"
                          className="text-red-600 hover:text-red-500"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Food Item Modal */}
            <Dialog
              open={foodModalOpen}
              onClose={closeFoodModal}
              fullWidth
              maxWidth="sm"
              PaperProps={{ className: "rounded-xl" }}
            >
              {/* Dialog Title with bigger padding and edge-close button */}
              <DialogTitle className={dialogTitleClasses}>
                {editingFood ? "Edit Food" : "Create Food"}
                <IconButton
                  onClick={closeFoodModal}
                  className="absolute -right-96 text-white hover:text-gray-200"
                  size="large"
                >
                  <Close />
                </IconButton>
              </DialogTitle>

              {/* Dialog Content with bigger padding */}
              <DialogContent dividers className={dialogContentClasses}>
                <Box className="space-y-6">
                  <FormControl fullWidth>
                    <InputLabel id="meal-type-label" className="text-gray-700">
                      Meal Type
                    </InputLabel>
                    <Select
                      labelId="meal-type-label"
                      name="mealType"
                      value={foodForm.mealType}
                      onChange={handleFoodFormChange}
                      label="Meal Type"
                      className="rounded-md"
                    >
                      <MenuItem value="starter">Starter</MenuItem>
                      <MenuItem value="launch">Launch</MenuItem>
                      <MenuItem value="dinner">Dinner</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Category selection using fixed options */}
                  <FormControl fullWidth>
                    <InputLabel id="category-label" className="text-gray-700">
                      Category
                    </InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={
                        // When custom input is shown, keep value empty so the TextField controls it
                        showCustomInput ? "custom" : foodForm.category
                      }
                      onChange={handleCategoryChange}
                      label="Category"
                      className="rounded-md"
                    >
                      {fixedCategories.map((cat, index) => (
                        <MenuItem key={index} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                      <MenuItem value="custom">+ Add Custom</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Render Custom Category text field if "Add Custom" is selected */}
                  {showCustomInput && (
                    <Box mt={2} display="flex" alignItems="center">
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Custom Category"
                        value={customCategory}
                        onChange={(e) => {
                          setCustomCategory(e.target.value);
                          setFoodForm((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }));
                        }}
                      />
                      <IconButton
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomCategory("");
                          setFoodForm((prev) => ({ ...prev, category: "" }));
                        }}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  )}

                  <TextField
                    name="name"
                    label="Food Name"
                    fullWidth
                    variant="outlined"
                    className="rounded-md"
                    value={foodForm.name}
                    onChange={handleFoodFormChange}
                  />
                  <TextField
                    name="price"
                    label="Price"
                    type="number"
                    fullWidth
                    variant="outlined"
                    className="rounded-md"
                    value={foodForm.price}
                    onChange={handleFoodFormChange}
                  />
                  <TextField
                    name="description"
                    label="Description"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={4}
                    className="rounded-md"
                    value={foodForm.description}
                    onChange={handleFoodFormChange}
                  />
                </Box>
              </DialogContent>

              {/* Dialog Actions with bigger padding */}
              <DialogActions className={dialogActionsClasses}>
                <Button
                  onClick={closeFoodModal}
                  color="inherit"
                  className="text-gray-700 hover:underline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveFood}
                  variant="contained"
                  color="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FoodManagement;
