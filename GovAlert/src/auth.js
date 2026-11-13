// Keeps the logged-in user (and their token) in the browser between pages.

// URLs come from GovAlert/.env (see .env.example); localhost defaults are for development
const trimSlash = (url) => url.replace(/\/+$/, "");
export const API_URL = trimSlash(import.meta.env.VITE_API_URL || "http://localhost:5003");

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
export function fileUrl(path) {
  return path ? `${API_URL}/${String(path).replace(/\\/g, "/")}` : null;
}

export const COMMUNITY_URL = trimSlash(import.meta.env.VITE_COMMUNITY_URL || "http://localhost:4000");

export function authHeader() {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}
