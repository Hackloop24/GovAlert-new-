// Vercel serverless entry point: every request to /api/* is handled by the
// Express app in Backend/index.js. The "/api" prefix is removed first, so the
// backend's routes stay the same as when it runs locally on port 5003
// (e.g. /api/login -> /login, /api/api/reports -> /api/reports).
import app from "../Backend/index.js";

export default function handler(req, res) {
  req.url = req.url.replace(/^\/api(?=\/|\?|$)/, "") || "/";
  return app(req, res);
}
