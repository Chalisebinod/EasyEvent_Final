import { useState } from "react";
import { useForm } from "react-hook-form";
import VenueSidebar from "./VenueSidebar"; // Import the Sidebar component

const CreateVenue = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessMessage("");

    // Format data for the API
    const venueData = {
      name: data.name,
      owner: "679b3b21856e84146bed0716", // Replace with dynamic owner ID if available
      location: {
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
      },
      images: data.images.split(",").map((img) => img.trim()), // Convert comma-separated string to array
      capacity: parseInt(data.capacity),
      price: parseInt(data.price),
      amenities: data.amenities.split(",").map((item) => item.trim()), // Convert to array
    };

    try {
      // Get token from localStorage
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://localhost:8000/api/venue/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send token in Authorization header
        },
        body: JSON.stringify(venueData),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Venue created successfully!");
        reset();
      } else {
        alert(result.message || "Error creating venue");
      }
    } catch (error) {
      alert("Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <VenueSidebar /> {/* Add Sidebar to the page */}
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10 w-full ml-60">
        <h2 className="text-2xl font-bold mb-5">Create a Venue</h2>

        {successMessage && (
          <p className="text-green-600 font-semibold">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Venue Name */}
          <div>
            <label className="block font-medium">Venue Name</label>
            <input
              {...register("name", { required: "Venue name is required" })}
              type="text"
              className="w-full border px-3 py-2 rounded-lg"
            />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium">Address</label>
            <input
              {...register("address", { required: "Address is required" })}
              type="text"
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">City</label>
              <input
                {...register("city", { required: "City is required" })}
                type="text"
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium">State</label>
              <input
                {...register("state", { required: "State is required" })}
                type="text"
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
          </div>

          {/* Zip Code */}
          <div>
            <label className="block font-medium">Zip Code</label>
            <input
              {...register("zip_code", { required: "Zip Code is required" })}
              type="text"
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          {/* Capacity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Capacity</label>
              <input
                {...register("capacity", { required: "Capacity is required" })}
                type="number"
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium">Price ($)</label>
              <input
                {...register("price", { required: "Price is required" })}
                type="number"
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block font-medium">
              Images (comma-separated URLs)
            </label>
            <input
              {...register("images")}
              type="text"
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="block font-medium">
              Amenities (comma-separated)
            </label>
            <input
              {...register("amenities")}
              type="text"
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Venue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateVenue;
