// Keeps the logged-in user (and their token) in the browser between pages.

// URLs come from GovAlert/.env (see .env.example). Defaults: localhost ports in
// development; same-domain paths in production builds (the Vercel deployment serves
// the API at /api and the Community portal at /community).
const trimSlash = (url) => url.replace(/\/+$/, "");
const PROD = import.meta.env.PROD;
export const API_URL = trimSlash(import.meta.env.VITE_API_URL || (PROD ? "/api" : "http://localhost:5003"));

const KEY = "govalert_session";

export function saveSession({ token, user }) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

// Full URL for a file stored by the backend (e.g. "uploads/123-photo.jpg")
// (or a full URL when files are kept in cloud storage such as Vercel Blob)
export function fileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}/${String(path).replace(/\\/g, "/")}`;
}

export const COMMUNITY_URL = trimSlash(import.meta.env.VITE_COMMUNITY_URL || (PROD ? "/community" : "http://localhost:4000"));

export function authHeader() {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}
