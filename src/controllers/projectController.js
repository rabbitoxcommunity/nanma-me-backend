const Project = require("../models/Project");
const cloudinary = require("../config/cloudinary");

const PROJECT_FIELDS = [
  "reraNumber",
  "name",
  "tagline",
  "location",
  "status",
  "propertyType",
  "sqft",
  "bhk",
  "developmentSize",
  "floor",
  "units",
  "priceFrom",
  "handover",
  "description",
  "videoUrl",
  "amenities",
  "specifications",
  "mapEmbed",
  "metaTitle",
  "metaDescription",
  "keywords",
  "isPublished",
  "featured",
];

function pickBody(body) {
  const out = {};
  for (const k of PROJECT_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  // Normalise keywords: accept array or comma-separated string
  if (typeof out.keywords === "string") {
    out.keywords = out.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  // Normalise amenities/specifications safely
  if (typeof out.amenities === "string") {
    try { out.amenities = JSON.parse(out.amenities); } catch { /* ignore */ }
  }
  if (typeof out.specifications === "string") {
    try { out.specifications = JSON.parse(out.specifications); } catch { /* ignore */ }
  }
  return out;
}

// ─── Public ────────────────────────────────────────────
exports.list = async (req, res) => {
  const { status, featured, limit = 50, page = 1, q } = req.query;
  const filter = { isPublished: true };
  if (status && status !== "all") filter.status = status;
  if (featured === "true") filter.featured = true;
  if (q) filter.$text = { $search: q };

  const lim = Math.min(parseInt(limit, 10) || 50, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    Project.find(filter).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(lim).lean(),
    Project.countDocuments(filter),
  ]);

  res.json({ items, total, page: parseInt(page, 10) || 1, limit: lim });
};

exports.getBySlug = async (req, res) => {
  const project = await Project.findOne({
    slug: req.params.slug,
    isPublished: true,
  }).lean();
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
};

// ─── Admin ─────────────────────────────────────────────
exports.adminList = async (req, res) => {
  const { status, q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { location: new RegExp(q, "i") }];

  const lim = Math.min(parseInt(limit, 10) || 50, 200);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(lim).lean(),
    Project.countDocuments(filter),
  ]);

  res.json({ items, total });
};

exports.adminGet = async (req, res) => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
};

exports.create = async (req, res) => {
  const data = pickBody(req.body);
  data.createdBy = req.admin._id;
  const project = await Project.create(data);
  res.status(201).json(project);
};

exports.update = async (req, res) => {
  const data = pickBody(req.body);

  // Optional: replace media via separate fields when sent as JSON
  if (req.body.featuredImage !== undefined) data.featuredImage = req.body.featuredImage;
  if (req.body.galleryImages !== undefined) data.galleryImages = req.body.galleryImages;

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  Object.assign(project, data);
  await project.save();
  res.json(project);
};

exports.remove = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  // Best-effort Cloudinary cleanup
  const ids = [
    project.featuredImage?.publicId,
    ...(project.galleryImages || []).map((g) => g.publicId),
  ].filter(Boolean);
  for (const id of ids) {
    try { await cloudinary.uploader.destroy(id); } catch { /* ignore */ }
  }

  await project.deleteOne();
  res.json({ ok: true });
};

// ─── Media ────────────────────────────────────────────
// POST /api/admin/projects/:id/featured-image  (form-data: file)
exports.setFeaturedImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  // Remove old
  if (project.featuredImage?.publicId) {
    try { await cloudinary.uploader.destroy(project.featuredImage.publicId); } catch { /* ignore */ }
  }
  project.featuredImage = {
    url: req.file.path,
    publicId: req.file.filename,
    alt: project.name,
  };
  await project.save();
  res.json(project.featuredImage);
};

// POST /api/admin/projects/:id/gallery (form-data: files[])
exports.addGalleryImages = async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  const additions = req.files.map((f) => ({
    url: f.path,
    publicId: f.filename,
    alt: project.name,
  }));
  project.galleryImages.push(...additions);
  await project.save();
  res.json(project.galleryImages);
};

// DELETE /api/admin/projects/:id/gallery/:publicId
exports.removeGalleryImage = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });

  const publicId = decodeURIComponent(req.params.publicId);
  project.galleryImages = project.galleryImages.filter((g) => g.publicId !== publicId);
  try { await cloudinary.uploader.destroy(publicId); } catch { /* ignore */ }
  await project.save();
  res.json(project.galleryImages);
};
