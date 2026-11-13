// URLs come from Community_portal/.env (see .env.example). Defaults: localhost in
// development; in production builds GovAlert is served from the same domain's root.
export const GOVALERT_URL = (
  import.meta.env.VITE_GOVALERT_URL || (import.meta.env.PROD ? "" : "http://localhost:5110")
).replace(/\/+$/, "");

// Base path this app is served from ("/" locally, "/community/" on Vercel)
export const BASE = import.meta.env.BASE_URL;
