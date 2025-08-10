const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Debug: Log Cloudinary configuration status
console.log('Cloudinary Configuration:');
console.log('Cloud Name:', process.env.CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('API Key:', process.env.CLOUD_API_KEY ? '✓ Set' : '✗ Missing');
console.log('API Secret:', process.env.CLOUD_API_SECRET ? '✓ Set' : '✗ Missing');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'study-planner-uploads', // More specific folder name
    allowedFormats: ['pdf', 'txt', 'doc', 'docx','jpg', 'png'], // add supported formats
    resource_type: 'raw', // <-- IMPORTANT for non-image files
    use_filename: true, // Preserve original filename
    unique_filename: false // Allow duplicate filenames
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
