import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, authHeader, clearSession, fileUrl, getSession } from "../auth";
import { STATUSES, STATUS_STYLE, formatINR, placeOf } from "../status";
import { useToast } from "../components/Toaster";
import { compressImage } from "../compressImage";

const field = "px-3 py-2 bg-gray-900 text-gray-200 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500";

function ReportRow({ report, onSaved, onAuthError }) {
  const [status, setStatus] = useState(report.status || "Pending");
  const [note, setNote] = useState("");
  const [allocated, setAllocated] = useState(report.fund?.allocated || "");
  const [utilized, setUtilized] = useState(report.fund?.utilized || "");
  const [responseProof, setResponseProof] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const proofs = report.proofs?.length ? report.proofs : [report.proof].filter(Boolean);

  const save = async () => {
    setError("");
    if (Number(utilized || 0) > Number(allocated || 0))
      return setError("Funds utilised cannot be more than funds allocated.");

    const current = report.status || "Pending";
    if (status !== current && (status === "Resolved" || status === "Rejected")) {
      const ok = await toast.confirm({
        title: `Mark as ${status}?`,
        message: `Report #${report.queryNumber} will be shown to the citizen as ${status.toLowerCase()}.${
          status === "Resolved" && !responseProof && !report.responseProof ? " Tip: attach a proof of work so citizens can see the fix." : ""
        }`,
        confirmText: `Mark ${status}`,
        tone: status === "Rejected" ? "danger" : "success",
        icon: status === "Rejected" ? "fa-ban" : "fa-circle-check",
      });
      if (!ok) return;
    }

    const data = new FormData();
    data.append("status", status);
    data.append("note", note);
    data.append("fundAllocated", allocated || 0);
    data.append("fundUtilized", utilized || 0);
    if (responseProof) data.append("responseProof", responseProof);

    setSaving(true);
    try {
      const res = await axios.patch(`${API_URL}/api/reports/${report._id}`, data, { headers: authHeader() });
      setNote("");
      setResponseProof(null);
      setFileKey((k) => k + 1); // clears the file input
      onSaved(res.data);
      toast.success("Response saved", `Report #${report.queryNumber} is now ${res.data.status}.`);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) return onAuthError();
      setError(err.response?.data?.message || "Could not update the report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-left">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <h3 className="text-lg font-semibold text-blue-300">Report #{report.queryNumber}</h3>
        <span className={`text-xs font-semibold py-1 px-2 uppercase rounded-full ${STATUS_STYLE[report.status || "Pending"]}`}>
          {report.status || "Pending"}
        </span>
      </div>
      <p className="text-gray-200 mb-3">{report.description}</p>
      <p className="text-gray-400 text-sm mb-1">
        <i className="fa-solid fa-location-dot mr-1"></i>{placeOf(report)}
        {report.location?.lat != null && (
          <a className="text-blue-400 hover:underline ml-2" target="_blank" rel="noreferrer"
             href={`https://www.openstreetmap.org/?mlat=${report.location.lat}&mlon=${report.location.lng}#map=17/${report.location.lat}/${report.location.lng}`}>
            Open map
          </a>
        )}
      </p>
      <p className="text-gray-500 text-sm mb-3">
        Submitted {new Date(report.createdAt).toLocaleString("en-IN")}
        {report.submittedBy?.username ? ` by ${report.submittedBy.username}` : ""}
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        {proofs.map((p, i) => (
          <a key={p} href={fileUrl(p)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
            <i className="fa-solid fa-paperclip mr-1"></i>Citizen proof {proofs.length > 1 ? i + 1 : ""}
          </a>
        ))}
        {report.responseProof && (
          <a href={fileUrl(report.responseProof)} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">
            <i className="fa-solid fa-circle-check mr-1"></i>Your proof of work
          </a>
        )}
      </div>
      {report.fund?.allocated > 0 && (
        <p className="text-gray-400 text-sm mt-2">
          Funds: {formatINR(report.fund.utilized)} used of {formatINR(report.fund.allocated)}
        </p>
      )}

      {report.statusUpdates?.length > 0 && (
        <ul className="mt-3 text-gray-400 text-sm list-disc list-inside">
          {report.statusUpdates.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-700 pt-4">
        <label className="text-sm text-gray-400">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} w-full mt-1`}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-400">
          Response note for the citizen
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional"
                 className={`${field} w-full mt-1`} />
        </label>
        <label className="text-sm text-gray-400">
          Funds allocated (₹)
          <input type="number" min="0" value={allocated} onChange={(e) => setAllocated(e.target.value)}
                 className={`${field} w-full mt-1`} />
        </label>
        <label className="text-sm text-gray-400">
          Funds utilised (₹)
          <input type="number" min="0" value={utilized} onChange={(e) => setUtilized(e.target.value)}
                 className={`${field} w-full mt-1`} />
        </label>
        <label className="text-sm text-gray-400 md:col-span-2">
          Proof of work (photo, video or PDF, optional)
          <input key={fileKey} type="file" accept="image/*,video/*,application/pdf"
                 onChange={async (e) => {
                   const file = e.target.files?.[0];
                   setResponseProof(file ? await compressImage(file) : null);
                 }}
                 className="block w-full mt-1 text-gray-300" />
        </label>
      </div>
      <div className="mt-3 text-right">
        <button onClick={save} disabled={saving}
                className={`px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${saving ? "opacity-50" : ""}`}>
          {saving ? "Saving..." : "Save response"}
        </button>
      </div>
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();
  const session = getSession();
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/reports`)
      .then(({ data }) => setReports(data))
      .catch(() => setError("Failed to fetch reports. Is the backend running?"));
  }, []);

  if (session?.user?.role !== "admin") return <Navigate to="/login" replace />;

  const logout = async () => {
    const ok = await toast.confirm({
      title: "Log out of admin?",
      message: "You'll need to sign in again to manage reports.",
      confirmText: "Log out",
      icon: "fa-right-from-bracket",
    });
    if (!ok) return;
    clearSession();
    toast.success("Logged out", "Admin session ended.");
    navigate("/login");
  };

  const handleAuthError = () => {
    clearSession();
    toast.warning("Session expired", "Your admin session has expired. Please sign in again.");
    navigate("/login");
  };

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: reports.filter((r) => (r.status || "Pending") === s).length }),
    {}
  );
  const shown = filter === "All" ? reports : reports.filter((r) => (r.status || "Pending") === filter);

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen w-full flex flex-col">
      <nav className="bg-gray-800 p-4 shadow-lg flex justify-between items-center w-full sticky top-0 z-50">
        <div className="flex items-center space-x-2 text-blue-400 font-bold text-xl">
          <i className="fa fa-user-shield"></i><span>GovAlert Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:inline">{session.user.email}</span>
          <button
            onClick={logout}
            className="text-blue-400 hover:text-blue-500 px-4 py-2 rounded-lg border border-blue-400 hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-6">Reported Grievances</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {["All", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`p-3 rounded-lg text-left ${filter === s ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
            >
              <div className="text-sm opacity-80">{s}</div>
              <div className="text-2xl font-bold">{s === "All" ? reports.length : counts[s]}</div>
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        <div className="grid gap-4">
          {shown.length > 0 ? (
            shown.map((r) => (
              <ReportRow
                key={r._id}
                report={r}
                onAuthError={handleAuthError}
                onSaved={(updated) => setReports((all) => all.map((x) => (x._id === updated._id ? updated : x)))}
              />
            ))
          ) : (
            !error && <p className="text-gray-400">No reports in this category.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Admin;
