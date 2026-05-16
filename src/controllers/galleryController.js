const Gallery = require("../models/Gallery");
const cloudinary = require("../config/cloudinary");

function toEmbedUrl(input = "") {
  // Accept full URL or video ID, return /embed/ form
  const match =
    input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  const id = match ? match[1] : input.trim();
  if (!id || !/^[\w-]{6,}$/.test(id)) return input;
  return `https://www.youtube.com/embed/${id}`;
}

// ─── Public ────────────────────────────────────────────
exports.list = async (req, res) => {
  const { category, onHome, limit } = req.query;
  const filter = { isPublished: true };
  if (category && category !== "all") filter.category = category;
  if (onHome === "true") filter.showOnHome = true;
  const q = Gallery.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  if (limit) q.limit(Math.min(parseInt(limit, 10) || 50, 100));
  const items = await q.lean();
  res.json({ items });
};

// ─── Admin ─────────────────────────────────────────────
exports.adminList = async (req, res) => {
  const items = await Gallery.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ items });
};

// Helper — coerce form-data string "true"/"false" to boolean
const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

// Create a YouTube entry (no file upload needed)
exports.createYoutube = async (req, res) => {
  const { title, category, youtubeUrl, thumbnail, aspect, sortOrder, showOnHome } = req.body;
  if (!title || !youtubeUrl) return res.status(400).json({ error: "Title and YouTube URL are required" });

  const item = await Gallery.create({
    title,
    type: "youtube",
    category: category || "video",
    youtubeUrl: toEmbedUrl(youtubeUrl),
    thumbnail: thumbnail || "",
    aspect: aspect || "wide",
    sortOrder: sortOrder || 0,
    showOnHome: toBool(showOnHome),
  });
  res.status(201).json(item);
};

// Upload image
exports.uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { title, category, aspect, sortOrder, showOnHome } = req.body;
  const item = await Gallery.create({
    title: title || req.file.originalname,
    type: "image",
    category: category || "other",
    url: req.file.path,
    publicId: req.file.filename,
    aspect: aspect || "wide",
    sortOrder: Number(sortOrder) || 0,
    showOnHome: toBool(showOnHome),
  });
  res.status(201).json(item);
};

// Upload video (mp4 etc.)
exports.uploadVideo = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { title, category, aspect, sortOrder, showOnHome } = req.body;
  const item = await Gallery.create({
    title: title || req.file.originalname,
    type: "video",
    category: category || "video",
    url: req.file.path,
    publicId: req.file.filename,
    aspect: aspect || "wide",
    sortOrder: Number(sortOrder) || 0,
    showOnHome: toBool(showOnHome),
  });
  res.status(201).json(item);
};

exports.update = async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  const editable = ["title", "category", "aspect", "sortOrder", "isPublished", "thumbnail", "youtubeUrl", "showOnHome"];
  editable.forEach((k) => {
    if (req.body[k] !== undefined) item[k] = req.body[k];
  });
  if (item.type === "youtube" && req.body.youtubeUrl) {
    item.youtubeUrl = toEmbedUrl(req.body.youtubeUrl);
  }
  await item.save();
  res.json(item);
};

exports.remove = async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });

  if (item.publicId) {
    try {
      await cloudinary.uploader.destroy(item.publicId, {
        resource_type: item.type === "video" ? "video" : "image",
      });
    } catch { /* ignore */ }
  }
  await item.deleteOne();
  res.json({ ok: true });
};
