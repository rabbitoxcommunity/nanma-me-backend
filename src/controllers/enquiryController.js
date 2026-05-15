const Enquiry = require("../models/Enquiry");

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// ─── Public submit ────────────────────────────────────
exports.submit = async (req, res) => {
  const { name, phone, email, message, subject, projectName, projectId } = req.body || {};

  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: "Name, phone, email and message are required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const enquiry = await Enquiry.create({
    name: String(name).slice(0, 120),
    phone: String(phone).slice(0, 30),
    email: String(email).toLowerCase(),
    subject: String(subject || "").slice(0, 200),
    message: String(message).slice(0, 5000),
    projectName: projectName || "",
    projectId: projectId || null,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });

  res.status(201).json({ ok: true, id: enquiry._id });
};

// ─── Admin ─────────────────────────────────────────────
exports.adminList = async (req, res) => {
  const { status, q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") },
    ];
  }

  const lim = Math.min(parseInt(limit, 10) || 50, 200);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({ items, total });
};

exports.adminGet = async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).lean();
  if (!enquiry) return res.status(404).json({ error: "Not found" });
  res.json(enquiry);
};

exports.update = async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return res.status(404).json({ error: "Not found" });
  if (req.body.status) enquiry.status = req.body.status;
  if (req.body.notes !== undefined) enquiry.notes = req.body.notes;
  await enquiry.save();
  res.json(enquiry);
};

exports.remove = async (req, res) => {
  const r = await Enquiry.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
};
