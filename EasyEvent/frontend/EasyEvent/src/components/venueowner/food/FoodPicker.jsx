import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";

// Helper function to group food items by mealType and category
const groupFoods = (foods) => {
  const grouped = {};
  foods.forEach((food) => {
    const { mealType, category } = food;
    if (!grouped[mealType]) {
      grouped[mealType] = {};
    }
    if (!grouped[mealType][category]) {
      grouped[mealType][category] = [];
    }
    grouped[mealType][category].push(food);
  });
  return grouped;
};

const FoodPicker = ({ onSelectionChange }) => {
  // All food items fetched for the current venue
  const [foods, setFoods] = useState([]);
  // Foods grouped by mealType and category
  const [groupedFoods, setGroupedFoods] = useState({});
  // Selected meal type (tab)
  const [selectedMealType, setSelectedMealType] = useState("starter");
  // Selected category within the meal type
  const [selectedCategory, setSelectedCategory] = useState("");
  // Selected food IDs
  const [selectedFoodIds, setSelectedFoodIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Retrieve venue ID from localStorage
  const venueId = localStorage.getItem("venueID");
  console.log("venue ID", venueId)

  // Fetch foods for the current venue on mount
  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:8000/api/food/venue/${venueId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
        );
        const fetchedFoods = response.data.foods || [];
        setFoods(fetchedFoods);
        const grouped = groupFoods(fetchedFoods);
        setGroupedFoods(grouped);
        // Initialize selected category to the first available category for the default meal type
        if (grouped["starter"]) {
          const categories = Object.keys(grouped["starter"]);
          if (categories.length > 0) {
            setSelectedCategory(categories[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching foods:", error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchFoods();
    }
  }, [venueId]);

  // When meal type changes, update selectedMealType and reset category to first available if exists
  const handleMealTypeChange = (event, newMealType) => {
    setSelectedMealType(newMealType);
    if (groupedFoods[newMealType]) {
      const categories = Object.keys(groupedFoods[newMealType]);
      setSelectedCategory(categories[0] || "");
    } else {
      setSelectedCategory("");
    }
  };

  // Toggle selection of a food item
  const handleFoodToggle = (foodId) => {
    let updatedSelection;
    if (selectedFoodIds.includes(foodId)) {
      updatedSelection = selectedFoodIds.filter((id) => id !== foodId);
    } else {
      updatedSelection = [...selectedFoodIds, foodId];
    }
    setSelectedFoodIds(updatedSelection);
    if (onSelectionChange) {
      onSelectionChange(updatedSelection);
    }
  };

  // Get available categories for the current meal type
  const categoriesForMeal = groupedFoods[selectedMealType]
    ? Object.keys(groupedFoods[selectedMealType])
    : [];

  // Get food items for the current selected meal type and category
  const foodItemsToDisplay =
    groupedFoods[selectedMealType] && groupedFoods[selectedMealType][selectedCategory]
      ? groupedFoods[selectedMealType][selectedCategory]
      : [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Select Foods for the Package
      </Typography>
      {/* Meal Type Tabs */}
      <Tabs
        value={selectedMealType}
        onChange={handleMealTypeChange}
        textColor="primary"
        indicatorColor="primary"
      >
        {["starter", "launch", "dinner"].map((meal) => (
          <Tab key={meal} label={meal.toUpperCase()} value={meal} />
        ))}
      </Tabs>

      {/* Category Selection */}
      {categoriesForMeal.length > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Categories:
          </Typography>
          <ButtonGroup variant="outlined" color="primary">
            {categoriesForMeal.map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? "contained" : "outlined"}
              >
                {cat}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Food Items List */}
      <Grid container spacing={2}>
        {foodItemsToDisplay.map((food) => (
          <Grid item xs={12} sm={6} md={4} key={food._id}>
            <Paper sx={{ p: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFoodIds.includes(food._id)}
                    onChange={() => handleFoodToggle(food._id)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1">{food.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rs.{food.price}
                    </Typography>
                    {food.description && (
                      <Typography variant="caption" color="text.secondary">
                        {food.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </Paper>
          </Grid>
        ))}
        {foodItemsToDisplay.length === 0 && !loading && (
          <Grid item xs={12}>
            <Typography>No foods available for this category.</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default FoodPicker;
