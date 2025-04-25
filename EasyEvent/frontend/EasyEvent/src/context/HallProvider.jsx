import React, { createContext, useContext, useEffect, useState } from "react";

const HallContext = createContext();

export const useHallContext = () => useContext(HallContext);

export const HallProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const accessToken = localStorage.getItem("access_token");

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8000/api/venueOwner/profile", {
                method: "GET",
                credentials: "include",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user profile");
            }

            const data = await response.json();
            setUser(data);

            if (data.venue) {
                setVenue(data.venue);
            }

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    return (
        <HallContext.Provider value={{ user, venue, loading, error, fetchUserProfile }}>
            {children}
        </HallContext.Provider>
    );
};

export default HallProvider;
