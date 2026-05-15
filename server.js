require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = parseInt(process.env.PORT, 10) || 5000;
const isDev = process.env.NODE_ENV !== "production";

(async () => {
  try {
    await connectDB();
  } catch (err) {
    if (isDev) {
      console.error("\n  ✖ MongoDB connection failed in dev — starting API anyway.");
      console.error("    Reason:", err.message);
      console.error("    Login and other DB-backed routes will return 500 until Mongo is up.\n");
    } else {
      throw err;
    }
  }

  const allowed = process.env.CLIENT_URL || "http://localhost:3001";

  app.listen(PORT, () => {
    console.log(`\n  ✓ Nanma API listening on http://localhost:${PORT}`);
    console.log(`  ✓ Health: http://localhost:${PORT}/health`);
    console.log(`  ✓ CORS allowed origins: ${allowed}`);
    if (isDev) {
      console.log(`    (in dev, any http://localhost:* and 127.0.0.1:* are also allowed)`);
    }
    console.log("");
  });
})();
