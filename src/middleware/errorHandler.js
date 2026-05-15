/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ error: `${field} already exists` });
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", ") });
  }

  // Multer file-size errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large" });
  }

  console.error("✖", err);
  res.status(err.status || 500).json({
    error: err.message || "Server error",
  });
}

module.exports = errorHandler;
