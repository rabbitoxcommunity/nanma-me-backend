const mongoose = require("mongoose");
const slugify = require("slugify");

const PROJECT_STATUSES = ["ongoing", "ready", "completed", "upcoming"];
const PROPERTY_TYPES = ["Apartment", "Villa", "Flat", "Plot", "Penthouse", "Duplex", "Studio", "Other"];

const amenitySchema = new mongoose.Schema(
  {
    icon: { type: String, default: "" }, // icon key (e.g. "pool") or URL
    title: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const specSchema = new mongoose.Schema(
  {
    icon: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const connectivitySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // "Airport"
    value: { type: String, default: "", trim: true },     // "12 km"
    time: { type: String, default: "", trim: true },      // "~22 min"
  },
  { _id: false }
);

const mediaAssetSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String }, // Cloudinary public_id (for deletion)
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    // Basics
    reraNumber: { type: String, trim: true, default: "" },
    name: { type: String, required: [true, "Project name is required"], trim: true },
    slug: { type: String, unique: true, lowercase: true, index: true },
    tagline: { type: String, default: "", trim: true },
    location: { type: String, required: true, trim: true },

    // Status & type
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      required: true,
      default: "ongoing",
      index: true,
    },
    propertyType: { type: String, enum: PROPERTY_TYPES, default: "Apartment" },
    // Free-text override when `propertyType === "Other"`
    propertyTypeOther: { type: String, default: "", trim: true },

    // Specs / sizing
    sqft: { type: String, default: "" },           // e.g. "1,840 – 4,200"
    bhk: { type: String, default: "" },            // e.g. "3 & 4 BHK"
    developmentSize: { type: String, default: "" }, // e.g. "3.2 Acres"
    floor: { type: String, default: "" },          // e.g. "G+42"
    units: { type: String, default: "" },          // e.g. "184"
    priceFrom: { type: String, default: "" },
    handover: { type: String, default: "" },

    // Rich text description (HTML from rich text editor)
    description: { type: String, default: "" },

    // Media
    featuredImage: { type: mediaAssetSchema, default: null },
    galleryImages: { type: [mediaAssetSchema], default: [] },
    videoUrl: { type: String, default: "" }, // YouTube embed/URL

    // Repeater fields
    amenities: { type: [amenitySchema], default: [] },
    specifications: { type: [specSchema], default: [] },
    connectivity: { type: [connectivitySchema], default: [] },

    // Map (optional)
    mapEmbed: { type: String, default: "" },

    // SEO
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },

    // Visibility
    isPublished: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    inBanner: { type: Boolean, default: false, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

projectSchema.index({ name: "text", location: "text", description: "text" });

// Auto-generate / refresh slug when name changes.
// Mongoose 9: async hooks return a promise — do NOT take or call `next`.
projectSchema.pre("validate", async function () {
  if (this.isModified("name") || !this.slug) {
    const base = slugify(this.name || "project", { lower: true, strict: true });
    let candidate = base;
    let counter = 1;
    while (
      await mongoose
        .model("Project")
        .findOne({ slug: candidate, _id: { $ne: this._id } })
        .lean()
    ) {
      candidate = `${base}-${counter++}`;
    }
    this.slug = candidate;
  }
});

module.exports = mongoose.model("Project", projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
module.exports.PROPERTY_TYPES = PROPERTY_TYPES;
