const Admin = require("../models/Admin");
const { signToken } = require("../middleware/auth");

exports.login = async (req, res) => {
  console.log("Login attempt:", req.body);
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await admin.comparePassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);
  res.json({ token, admin: admin.toSafeJSON() });
};

exports.me = async (req, res) => {
  res.json({ admin: req.admin.toSafeJSON() });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both passwords required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  const ok = await req.admin.comparePassword(currentPassword);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });
  await req.admin.setPassword(newPassword);
  await req.admin.save();
  res.json({ ok: true });
};
