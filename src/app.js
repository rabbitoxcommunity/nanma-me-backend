const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const sanitize = require("./middleware/sanitize");
const rateLimit = require("express-rate-limit");
const { buildSitemap, buildRobots } = require("./utils/sitemap");

const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/projects.routes");
const galleryRoutes = require("./routes/gallery.routes");
const enquiryRoutes = require("./routes/enquiries.routes");
const statsRoutes = require("./routes/stats.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

// ─── Debug: log every incoming request (top of chain) ────────
app.use((req, _res, next) => {
  console.log(
    `→ ${req.method} ${req.originalUrl}  origin=${req.headers.origin || "-"}`
  );
  next();
});

// ─── CORS (hand-rolled, dev-permissive) ──────────────
// In dev: echo back whatever origin the browser sends — guarantees no CORS
// rejection regardless of what port the frontend runs on. Production uses the
// CLIENT_URL allow-list.
const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3001")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (!isProd) return true; // ← dev: anything goes
  return allowedOrigins.includes(origin.replace(/\/$/, ""));
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Always set CORS headers — even on error paths — so the browser shows the
  // real underlying error instead of a generic "blocked by CORS policy".
  if (origin) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      isAllowedOrigin(origin) ? origin : "null"
    );
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Preflight — handle and short-circuit
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  next();
});

// ─── DEBUG: tells the browser exactly what reached the server ─
app.get("/api/debug/cors", (req, res) => {
  res.json({
    ok: true,
    yourOrigin: req.headers.origin || null,
    allowedFromEnv: allowedOrigins,
    nodeEnv: process.env.NODE_ENV || "development",
    method: req.method,
    headers: req.headers,
    note: "If you can read this from the browser console, CORS is working.",
  });
});

// ─── Security headers ─────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(compression());
app.use(sanitize);

if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Global rate limit — gentle, skips preflight
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
  })
);

// ─── Health ──────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV })
);

// ─── API ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/stats", statsRoutes);

// ─── SEO files ───────────────────────────────────────
app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const xml = await buildSitemap();
    res.set("Content-Type", "application/xml").send(xml);
  } catch (err) {
    next(err);
  }
});

app.get("/robots.txt", (req, res) => {
  res.set("Content-Type", "text/plain").send(buildRobots());
});

// ─── 404 ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ─── Error handler ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
