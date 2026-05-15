const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Image storage (auto-optimised, on-the-fly resizing capability)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "nanma/images",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    transformation: [
      { width: 2000, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  }),
});

// Video storage
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "nanma/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "webm"],
  }),
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = { uploadImage, uploadVideo };
