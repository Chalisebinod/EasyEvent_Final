import React, { createContext, useState, useContext, useEffect } from "react";

// Create a context to store venueID
const VenueContext = createContext();

// Provider component that will wrap around your app
export const VenueProvider = ({ children }) => {
  const [venueID, setVenueID] = useState(null);

  // Optional: Retrieve venueID from localStorage or sessionStorage
  useEffect(() => {
    const savedVenueID = localStorage.getItem("venueID");
    if (savedVenueID) {
      setVenueID(savedVenueID);
    }
  }, []);

  const updateVenueID = (newVenueID) => {
    setVenueID(newVenueID);
    localStorage.setItem("venueID", newVenueID); // Save to localStorage
  };

  return (
    <VenueContext.Provider value={{ venueID, updateVenueID }}>
      {children}
    </VenueContext.Provider>
  );
};

// Custom hook to access the venue context
export const useVenue = () => {
  return useContext(VenueContext);
};
