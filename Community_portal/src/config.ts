// URLs come from Community_portal/.env (see .env.example); localhost default is for development
export const GOVALERT_URL = (import.meta.env.VITE_GOVALERT_URL || "http://localhost:5110").replace(/\/+$/, "");
