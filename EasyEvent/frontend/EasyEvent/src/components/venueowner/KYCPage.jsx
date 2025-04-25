import axios from "axios";
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VenueSidebar from "./VenueSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const KYCPage = () => {
  const navigate = useNavigate();
  const fileInputRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const [existingKyc, setExistingKyc] = useState(null); // stores fetched KYC data

  // To store preview URLs for individual document uploads
  const [docPreviewUrls, setDocPreviewUrls] = useState({});
  // To store the actual file objects for required documents (only for new uploads)
  const [docFiles, setDocFiles] = useState({});

  // Venue images (files selected in the current session)
  const [venueImages, setVenueImages] = useState([]);
  // URLs to preview images (either fetched from backend or created on the fly)
  const [venueImagesUrls, setVenueImagesUrls] = useState([]);

  // Form values for venue details
  const [formValues, setFormValues] = useState({
    venueName: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  // List of required file fields
  const fileFields = [
    "profile",
    "citizenshipFront",
    "citizenshipBack",
    "pan",
    "map",
    "signature",
  ];

  // Determine if the form is editable.
  // It is editable when there is no existing KYC or if the existing KYC verificationStatus is "rejected".
  const isEditable = !existingKyc || existingKyc.status === "rejected";

  // Cleanup object URLs on unmount or when they change
  useEffect(() => {
    return () => {
      Object.values(docPreviewUrls).forEach(
        (url) => url && URL.revokeObjectURL(url)
      );
      venueImagesUrls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [docPreviewUrls, venueImagesUrls]);

  const getImageUrl = (path) => {
    if (path && path.startsWith("http")) {
      return path;
    }
    return `http://localhost:8000/${path}`; // Adjust base URL as needed
  };

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          "http://localhost:8000/api/kyc/venue-kycs",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data && response.data.data) {
          const kycData = response.data.data;
          setExistingKyc(kycData);

          // If the KYC is rejected, clear all fields so that the venue owner can submit again.
          if (kycData.status === "rejected") {
            setFormValues({
              venueName: "",
              address: "",
              city: "",
              state: "",
              zip_code: "",
            });
            setDocPreviewUrls({
              profile: "",
              citizenshipFront: "",
              citizenshipBack: "",
              pan: "",
              map: "",
              signature: "",
            });
            setVenueImagesUrls([]);
          } else {
            // Otherwise, populate the form with the fetched data.
            setFormValues({
              venueName: kycData.venueName || "",
              address: kycData.venueAddress?.address || "",
              city: kycData.venueAddress?.city || "",
              state: kycData.venueAddress?.state || "",
              zip_code: kycData.venueAddress?.zip_code || "",
            });
            setDocPreviewUrls({
              profile: kycData.profileImage
                ? getImageUrl(kycData.profileImage)
                : "",
              citizenshipFront: kycData.citizenshipFront
                ? getImageUrl(kycData.citizenshipFront)
                : "",
              citizenshipBack: kycData.citizenshipBack
                ? getImageUrl(kycData.citizenshipBack)
                : "",
              pan: kycData.pan ? getImageUrl(kycData.pan) : "",
              map: kycData.map ? getImageUrl(kycData.map) : "",
              signature: kycData.signature ? getImageUrl(kycData.signature) : "",
            });
            if (kycData.venueImages && Array.isArray(kycData.venueImages)) {
              setVenueImagesUrls(
                kycData.venueImages.map((path) => getImageUrl(path))
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching KYC data", error);
      }
    };

    fetchKyc();
  }, []);

  // Handle input changes for venue information
  const handleInputChange = (e) => {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle file input changes for documents
  const handleFileChange = (field, e, multiple = false) => {
    if (!isEditable) return; // Prevent changes if not editable

    if (multiple) {
      // Not used now since venue images have their own handler.
      const files = Array.from(e.target.files);
      if (venueImages.length + files.length > 3) {
        alert("You can only upload a total of 3 venue images.");
        return;
      }
      const urls = files.map((file) => URL.createObjectURL(file));
      setVenueImages((prev) => [...prev, ...files]);
      setVenueImagesUrls((prev) => [...prev, ...urls]);
      e.target.value = "";
    } else {
      const file = e.target.files[0];
      if (!file) return;

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024;
      if (!allowedTypes.includes(file.type) || file.size > maxSize) {
        alert("Invalid file! Only JPG, PNG, and PDF under 5MB are allowed.");
        return;
      }
      const url = URL.createObjectURL(file);
      setDocPreviewUrls((prev) => ({ ...prev, [field]: url }));
      setDocFiles((prev) => ({ ...prev, [field]: file }));
    }
  };

  // New handler for each venue image slot (single file per slot)
  const handleVenueImageChange = (index, e) => {
    if (!isEditable) return;
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type) || file.size > maxSize) {
      alert("Invalid file! Only JPG and PNG under 5MB are allowed for venue images.");
      return;
    }
    const url = URL.createObjectURL(file);
    setVenueImages((prev) => {
      const newArr = [...prev];
      newArr[index] = file;
      return newArr;
    });
    setVenueImagesUrls((prev) => {
      const newArr = [...prev];
      newArr[index] = url;
      return newArr;
    });
  };

  // Handle form submission to send the KYC data
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!isEditable) return;
  
    const { venueName, address, city, state, zip_code } = formValues;
  
    // Validation: Ensure all required fields are filled
    if (!venueName || !address || !city || !state || !zip_code) {
      alert("Please fill in all required venue details.");
      return;
    }
  
    // Validation: Ensure address, city, and state contain only letters and spaces
    const wordRegex = /^[a-zA-Z\s]+$/; // Allows letters and spaces only
    if (!wordRegex.test(address)) {
      alert("Address should contain only letters and spaces.");
      return;
    }
    if (!wordRegex.test(city)) {
      alert("City should contain only letters and spaces.");
      return;
    }
    if (!wordRegex.test(state)) {
      alert("State should contain only letters and spaces.");
      return;
    }
  
    // Validation: Ensure zip code is numeric
    if (isNaN(zip_code)) {
      alert("Zip Code should be numeric.");
      return;
    }
  
    // Validation: Ensure required documents are uploaded
    if (!docFiles.profile && !docPreviewUrls.profile) {
      alert("Please upload your profile document.");
      return;
    }
    if (!docFiles.citizenshipFront && !docPreviewUrls.citizenshipFront) {
      alert("Please upload the front side of your citizenship document.");
      return;
    }
    if (!docFiles.citizenshipBack && !docPreviewUrls.citizenshipBack) {
      alert("Please upload the back side of your citizenship document.");
      return;
    }
    if (!docFiles.pan && !docPreviewUrls.pan) {
      alert("Please upload your PAN document.");
      return;
    }
    if (!docFiles.map && !docPreviewUrls.map) {
      alert("Please upload your venue map.");
      return;
    }
    if (!docFiles.signature && !docPreviewUrls.signature) {
      alert("Please upload your signature.");
      return;
    }
  
    // Validation: Ensure exactly 3 venue images are uploaded
    const filledImagesCount = venueImagesUrls.filter((url) => !!url).length;
    if (filledImagesCount !== 3) {
      alert("Please upload exactly 3 venue images.");
      return;
    }
  
    setLoading(true);
    const formDataToSend = new FormData();
  
    // Append venue details
    formDataToSend.append("venueName", venueName);
    const venueAddress = { address, city, state, zip_code };
    formDataToSend.append("venueAddress", JSON.stringify(venueAddress));
  
    // Append required document files (only new files will be sent)
    fileFields.forEach((field) => {
      if (docFiles[field]) {
        formDataToSend.append(field, docFiles[field]);
      }
    });
  
    // Append new venue images (if any)
    venueImages.forEach((file) => {
      if (file) {
        formDataToSend.append("venueImages", file);
      }
    });
  
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://localhost:8000/api/kyc/post",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        toast.success("KYC submitted successfully. It may take some time for verification.");
        // Redirect to dashboard after a short delay.
        setTimeout(() => {
          navigate("/venue-owner-dashboard");
        }, 3000);
      }
    } catch (error) {
      alert(
        `Error updating KYC: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <VenueSidebar />
      <div className="flex-grow">
        <main className="p-8 bg-white">
          <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-orange-600 mb-4 text-center">
              KYC Verification
            </h2>

            {/* Show KYC status messages if data exists */}
            {existingKyc && (
              <div className="mb-4 p-4 border rounded-md text-center">
                {existingKyc.status === "pending" && (
                  <p className="text-blue-600">
                    Your KYC has been submitted for review. You cannot edit your details until a decision is made.
                  </p>
                )}
                {existingKyc.status === "approved" && (
                  <p className="text-green-600">
                    Your KYC is verified. You cannot modify your details.
                  </p>
                )}
                {existingKyc.status === "rejected" && (
                  <div className="text-red-600">
                    <p>Your KYC was rejected.</p>
                    <p>Reason: {existingKyc.rejectMsg}</p>
                    <p>You can update your details and resubmit.</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Venue Information Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Venue Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="venueName" className="block text-gray-700 font-medium">
                      Venue Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="venueName"
                      name="venueName"
                    
                      value={formValues.venueName}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className="mt-1 w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-gray-700 font-medium">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formValues.address}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className="mt-1 w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-gray-700 font-medium">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formValues.city}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        className="mt-1 w-full border border-gray-300 rounded-md p-2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-gray-700 font-medium">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formValues.state}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        className="mt-1 w-full border border-gray-300 rounded-md p-2"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="zip_code" className="block text-gray-700 font-medium">
                        Zip Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="zip_code"
                        name="zip_code"
                        value={formValues.zip_code}
                        onChange={handleInputChange}
                        disabled={!isEditable}
                        className="mt-1 w-full border border-gray-300 rounded-md p-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Document Upload Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Upload Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fileFields.map((field) => (
                    <div key={field} className="flex flex-col items-center border p-4 rounded-md">
                      <label className="mb-2 text-gray-700 font-medium capitalize">
                        {field.replace(/([A-Z])/g, " $1")}
                      </label>
                      <div className="w-56 h-56 border border-dashed border-gray-300 flex items-center justify-center mb-2 rounded-md bg-gray-100">
                        {docPreviewUrls[field] ? (
                          <img
                            src={docPreviewUrls[field]}
                            alt={field}
                            className="object-cover w-full h-full rounded-md"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No file</span>
                        )}
                      </div>
                      {isEditable && (
                        <>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[field]?.click()}
                            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition"
                          >
                            Upload
                          </button>
                          <input
                            type="file"
                            ref={(el) => (fileInputRefs.current[field] = el)}
                            onChange={(e) => handleFileChange(field, e)}
                            className="hidden"
                            accept="image/*,application/pdf"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Venue Images Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Upload Venue Images <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="border p-4 rounded-md flex flex-col items-center">
                      {venueImagesUrls[index] ? (
                        <img
                          src={venueImagesUrls[index]}
                          alt={`Venue Image ${index + 1}`}
                          className="w-48 h-48 object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                      {isEditable && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => (fileInputRefs.current[`venueImage${index}`] = el)}
                            onChange={(e) => handleVenueImageChange(index, e)}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[`venueImage${index}`]?.click()}
                            className="mt-2 bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition"
                          >
                            Upload Image {index + 1}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <small className="mt-2 text-gray-500">
                  Please upload exactly 3 images.
                </small>
              </section>

              {/* Submit button appears only if the form is editable */}
              {isEditable && (
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit KYC"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default KYCPage;
