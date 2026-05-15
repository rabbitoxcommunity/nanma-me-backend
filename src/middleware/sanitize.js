/**
 * Strip MongoDB operator characters ($ and .) from object keys to block
 * NoSQL-injection payloads. Only mutates req.body (req.query is read-only in
 * Express 5; we don't accept Mongo operators in URL strings anywhere).
 */
function clean(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) clean(item);
    return;
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const v = obj[key];
    if (v && typeof v === "object") clean(v);
  }
}

module.exports = function sanitize(req, _res, next) {
  if (req.body) clean(req.body);
  next();
};
