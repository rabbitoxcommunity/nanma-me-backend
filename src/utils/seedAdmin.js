// Seed the initial admin account from .env values.
// Usage:  npm run seed:admin
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const connectDB = require("../config/db");

(async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("✖ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  let admin = await Admin.findOne({ email });
  if (admin) {
    console.log(`ℹ Admin already exists: ${email}`);
    console.log("  Updating password from .env…");
    await admin.setPassword(password);
    admin.name = name;
    await admin.save();
  } else {
    admin = new Admin({ email, name, role: "admin" });
    await admin.setPassword(password);
    await admin.save();
    console.log(`✓ Admin created: ${email}`);
  }

  console.log("\nLogin with:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("\nThen change the password from the dashboard.");

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
