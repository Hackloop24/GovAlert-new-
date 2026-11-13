import React, { useRef, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import LocationPicker from "../components/LocationPicker";
import { useToast } from "../components/Toaster";
import { compressImage } from "../compressImage";
import { API_URL, authHeader, clearSession, getSession } from "../auth";

const FIELDS = [
  { name: "state", label: "State", placeholder: "e.g. Karnataka" },
  { name: "district", label: "District", placeholder: "e.g. Bengaluru Urban" },
  { name: "taluk", label: "Taluk", placeholder: "e.g. Bengaluru North" },
  { name: "municipal", label: "Panchayat / Municipal Corporation", placeholder: "e.g. BBMP" },
  { name: "pincode", label: "Pincode", placeholder: "6-digit pincode" },
];
const MAX_FILES = 5;
// Hosted (Vercel) requests are capped at ~4.5 MB in total; local development allows more
const MAX_SIZE = import.meta.env.PROD ? 4 * 1024 * 1024 : 10 * 1024 * 1024;
const MAX_TOTAL = import.meta.env.PROD ? 4 * 1024 * 1024 : 50 * 1024 * 1024;
const mb = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

const inputClass = "w-full p-2 rounded-md bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none focus:border-blue-500";

// Query number with a one-click copy button (shown in the success dialog)
function CopyCode({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked - the number is still visible to copy by hand */
    }
  };
  return (
    <div className="flex items-center justify-center gap-2 mt-3 bg-gray-900 rounded-lg px-3 py-2">
      <code className="text-lg text-white tracking-wide">{value}</code>
      <button type="button" onClick={copy} className="ga-toast-close" style={{ padding: "4px 8px", background: "transparent", border: "none", color: copied ? "#22c55e" : "#9ca3af" }}
              aria-label="Copy query number">
        <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
      </button>
    </div>
  );
}

const Report = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ description: "", state: "", district: "", taluk: "", municipal: "", pincode: "" });
  const [files, setFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [geo, setGeo] = useState({ loading: false, message: "", ok: true });
  const geoRequest = useRef(0);

  if (!getSession()) return <Navigate to="/login" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // When a pin is placed, look up its address and fill the location fields
  const handleLocation = async (point) => {
    setLocation(point);
    if (!point) return setGeo({ loading: false, message: "", ok: true });

    const id = ++geoRequest.current; // ignore answers for older pins
    setGeo({ loading: true, message: "Fetching address for this location...", ok: true });
    try {
      const { data } = await axios.get(`${API_URL}/api/geocode/reverse`, {
        params: { lat: point.lat, lng: point.lng },
        headers: authHeader(),
      });
      if (id !== geoRequest.current) return;
      const found = Object.fromEntries(Object.entries(data.address).filter(([, v]) => v));
      setForm((prev) => ({ ...prev, ...found }));
      const missing = FIELDS.filter((f) => !found[f.name]).map((f) => f.label);
      setGeo({
        loading: false,
        ok: true,
        message: missing.length
          ? `Address filled from the map. Please add: ${missing.join(", ")}.`
          : "Address filled from the map. Please check it's correct.",
      });
    } catch (err) {
      if (id !== geoRequest.current) return;
      setGeo({
        loading: false,
        ok: false,
        message: err.response?.data?.message || "Couldn't fetch the address. Please fill it in manually.",
      });
    }
  };

  const handleFiles = async (e) => {
    const input = e.target;
    const picked = Array.from(input.files || []);
    setError("");
    if (picked.length > MAX_FILES) return setError(`You can attach up to ${MAX_FILES} files.`);

    setPreparing(true);
    const ready = await Promise.all(picked.map((f) => compressImage(f)));
    setPreparing(false);

    const total = ready.reduce((sum, f) => sum + f.size, 0);
    if (ready.some((f) => f.size > MAX_SIZE) || total > MAX_TOTAL) {
      input.value = "";
      setFiles([]);
      return setError(`Files are too large: keep each under ${mb(MAX_SIZE)} and all together under ${mb(MAX_TOTAL)}. Photos are shrunk automatically; for videos, use a short clip.`);
    }
    setFiles(ready);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const missing = ["description", ...FIELDS.map((f) => f.name)].filter((k) => !form[k].trim());
    if (missing.length) return setError("Please fill in all the fields.");
    if (!/^\d{6}$/.test(form.pincode.trim())) return setError("Pincode must be 6 digits.");
    if (!files.length) return setError("Please attach at least one photo or document as proof.");

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v.trim()));
    files.forEach((f) => data.append("proof", f));
    if (location) {
      data.append("lat", location.lat);
      data.append("lng", location.lng);
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/report`, data, { headers: authHeader() });
      setSubmitting(false);
      const track = await toast.confirm({
        title: "Report submitted!",
        tone: "success",
        icon: "fa-circle-check",
        message: (
          <>
            <p>Authorities have been notified. Keep this query number to follow up:</p>
            <CopyCode value={res.data.queryNumber} />
          </>
        ),
        confirmText: "Track my report",
        cancelText: "Submit another",
      });
      if (track) return navigate("/track");
      setForm({ description: "", state: "", district: "", taluk: "", municipal: "", pincode: "" });
      setFiles([]);
      setLocation(null);
      setGeo({ loading: false, message: "", ok: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        toast.warning("Session expired", "Please sign in again to submit your report.");
        return navigate("/login");
      }
      setError(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 flex flex-col min-h-screen w-full">
      <NavBar />

      <section className="flex-grow container mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-blue-400 mb-2 text-center">Submit Your Grievance</h2>
        <p className="text-gray-400 mb-8 text-center">
          Describe the problem, attach proof and tell us where it is. Authorities will review and respond.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto" noValidate>
          <div>
            <label htmlFor="description" className="block text-gray-200 mb-1">Problem Description</label>
            <textarea id="description" name="description" rows="4" className={inputClass}
                      placeholder="Describe the issue..." value={form.description} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="proof" className="block text-gray-200 mb-1">
              Upload Proof <span className="text-gray-500">(photos, videos or PDF - up to 5 files, {mb(MAX_TOTAL)} in total; photos are resized automatically)</span>
            </label>
            <input type="file" id="proof" multiple accept="image/*,video/*,application/pdf"
                   onChange={handleFiles} className="block w-full text-gray-200" />
            {files.length > 0 && (
              <ul className="text-gray-400 text-sm mt-1">
                {files.map((f) => (
                  <li key={f.name}>
                    <i className="fa-solid fa-paperclip mr-1"></i>{f.name}
                    <span className="text-gray-500"> ({Math.max(1, Math.round(f.size / 1024))} KB)</span>
                  </li>
                ))}
              </ul>
            )}
            {preparing && (
              <p className="text-gray-400 text-sm mt-1"><i className="fa-solid fa-spinner fa-spin mr-1"></i>Preparing photos...</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-blue-300 mb-3">Location Details</h3>
            <LocationPicker value={location} onChange={handleLocation} />
            {geo.message && (
              <p className={`text-sm mt-2 ${geo.ok ? "text-green-400" : "text-yellow-400"}`}>
                <i className={`fa-solid ${geo.loading ? "fa-spinner fa-spin" : geo.ok ? "fa-circle-check" : "fa-triangle-exclamation"} mr-1`}></i>
                {geo.message}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {FIELDS.map((f) => (
                <div key={f.name}>
                  <label htmlFor={f.name} className="block text-gray-200 mb-1">{f.label}</label>
                  <input type="text" id={f.name} name={f.name} placeholder={f.placeholder} className={inputClass}
                         value={form[f.name]} onChange={handleChange}
                         inputMode={f.name === "pincode" ? "numeric" : undefined}
                         maxLength={f.name === "pincode" ? 6 : undefined} />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-center">{error}</p>}

          <div className="text-center">
            <button type="submit" disabled={submitting}
                    className={`bg-blue-500 text-gray-900 font-semibold py-2 px-6 rounded-md hover:bg-blue-600 ${submitting ? "opacity-50" : ""}`}>
              {submitting ? "Submitting..." : "Submit Grievance"}
            </button>
          </div>
        </form>
      </section>

      <footer className="text-center py-4 bg-gray-800 text-gray-400 w-full">
        &copy; 2024 Grievance Redressal Platform. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Report;
