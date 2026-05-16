const mongoose = require("mongoose");

const GALLERY_TYPES = ["image", "video", "youtube"];
const GALLERY_CATEGORIES = ["exterior", "interior", "amenities", "video", "other"];

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: GALLERY_TYPES, required: true },
    category: { type: String, enum: GALLERY_CATEGORIES, default: "other", index: true },

    // For images and uploaded videos (Cloudinary)
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    thumbnail: { type: String, default: "" }, // optional poster for video

    // For YouTube embeds — store either full URL or video ID
    youtubeUrl: { type: String, default: "" },

    aspect: { type: String, enum: ["tall", "wide", "square"], default: "wide" },
    sortOrder: { type: Number, default: 0, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    showOnHome: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", gallerySchema);
module.exports.GALLERY_TYPES = GALLERY_TYPES;
module.exports.GALLERY_CATEGORIES = GALLERY_CATEGORIES;
