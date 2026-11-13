// Shared report-status helpers (status is set by admins on the Admin dashboard)
export const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

export const STATUS_STYLE = {
  "Pending": "text-yellow-800 bg-yellow-200",
  "In Progress": "text-blue-800 bg-blue-200",
  "Resolved": "text-green-800 bg-green-200",
  "Rejected": "text-red-800 bg-red-200",
};

// Marker colours on the map
export const STATUS_COLOR = {
  "Pending": "#f59e0b",
  "In Progress": "#3b82f6",
  "Resolved": "#22c55e",
  "Rejected": "#ef4444",
};

const PROGRESS = { "Pending": 10, "In Progress": 50, "Resolved": 100, "Rejected": 100 };
export const progressOf = (status) => PROGRESS[status || "Pending"] ?? 0;

export const NEXT_STEP = {
  "Pending": "Government review",
  "In Progress": "Resolution by authorities",
  "Resolved": "Completed",
  "Rejected": "Closed",
};

export const statusOf = (report) => report.status || "Pending";

export const placeOf = (r) =>
  [r.municipal, r.taluk, r.district, r.state].filter(Boolean).join(", ") + (r.pincode ? ` - ${r.pincode}` : "");

export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
