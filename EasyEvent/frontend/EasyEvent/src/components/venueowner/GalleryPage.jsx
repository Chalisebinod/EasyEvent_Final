import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  // 1️⃣ Load existing images
  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery/my-gallery`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
      setMessage("Could not load gallery");
    }
  };

  // 2️⃣ Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage("Select at least one file");
      return;
    }
    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await fetch(`${API_BASE}/api/gallery/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // **no** Content‑Type here
        },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");
      setMessage("Upload successful!");
      setSelectedFiles([]);
      fetchImages();
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err.message);
    }
  };

  // 3️⃣ Delete one
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchImages();
    } catch (err) {
      console.error(err);
      setMessage("Delete failed");
    }
  };

  // 4️⃣ Delete all
  const handleDeleteAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gallery/delete-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete all failed");
      fetchImages();
    } catch (err) {
      console.error(err);
      setMessage("Delete all failed");
    }
  };

  React.useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Your Gallery</h1>

      <div className="flex items-center space-x-4 mb-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setSelectedFiles(e.target.files)}
          className="border p-2 rounded"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Upload
        </button>
        <button
          onClick={handleDeleteAll}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Delete All
        </button>
      </div>

      {message && <p className="mb-4 text-gray-700">{message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img._id} className="relative group">
            <img
              src={`${API_BASE}${img.url}`}
              alt="Gallery"
              className="w-full h-48 object-cover rounded shadow"
            />
            <button
              onClick={() => handleDelete(img._id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
