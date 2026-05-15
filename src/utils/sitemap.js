const Project = require("../models/Project");

const STATIC_PATHS = ["/", "/projects", "/about", "/gallery", "/contact"];

async function buildSitemap() {
  const base = (process.env.PUBLIC_SITE_URL || "https://nanmaestates.com").replace(/\/+$/, "");
  const projects = await Project.find({ isPublished: true }, "slug updatedAt").lean();

  const entries = [
    ...STATIC_PATHS.map((path) => ({
      loc: base + path,
      lastmod: new Date().toISOString(),
      priority: path === "/" ? "1.0" : "0.8",
    })),
    ...projects.map((p) => ({
      loc: `${base}/projects/${p.slug}`,
      lastmod: new Date(p.updatedAt).toISOString(),
      priority: "0.7",
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${e.priority}</priority>
  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return xml;
}

function buildRobots() {
  const base = (process.env.PUBLIC_SITE_URL || "https://nanmaestates.com").replace(/\/+$/, "");
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${base}/sitemap.xml
`;
}

module.exports = { buildSitemap, buildRobots };
