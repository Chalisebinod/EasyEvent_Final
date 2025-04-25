
const multer = require('multer');
const path = require('path');

// Set up storage for uploaded files 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Specify the folder where files will be uploaded
  },
  filename: (req, file, cb) => {
    // You can also generate custom filenames based on file fields
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames
  }
});

// File filter to accept specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false); // Reject file
  }
};

// Create multer instance with the storage settings and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

// Export the upload middleware for use in routes
module.exports = upload;
