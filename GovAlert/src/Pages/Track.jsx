import React, { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import ReportCard from "../components/ReportCard";
import { API_URL, authHeader, clearSession, getSession } from "../auth";
import { STATUSES, statusOf } from "../status";

const Track = () => {
  const navigate = useNavigate();
  const session = getSession();
  const [scope, setScope] = useState("mine"); // "mine" or "all"
  const [filter, setFilter] = useState("All");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError("");
    const url = scope === "mine" ? `${API_URL}/api/reports/mine` : `${API_URL}/api/reports`;
    axios
      .get(url, { headers: authHeader() })
      .then(({ data }) => setReports(data))
      .catch((err) => {
        if (err.response?.status === 401) {
          clearSession();
          navigate("/login");
        } else setError("Failed to fetch reports. Please try again later.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  if (!session) return <Navigate to="/login" replace />;

  const shown = filter === "All" ? reports : reports.filter((r) => statusOf(r) === filter);
  const tab = (active) => `px-4 py-2 rounded-md ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <NavBar />
      <section className="container mx-auto px-4 py-10 flex-grow">
        <h2 className="text-4xl font-bold text-blue-400 mb-2 text-center">View Report Progress</h2>
        <p className="text-gray-400 mb-8 text-center">Track the status and progress of submitted reports.</p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button className={tab(scope === "mine")} onClick={() => setScope("mine")}>My Reports</button>
          <button className={tab(scope === "all")} onClick={() => setScope("all")}>All Reports</button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1 rounded-full text-sm ${filter === s ? "bg-gray-200 text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {s} ({s === "All" ? reports.length : reports.filter((r) => statusOf(r) === s).length})
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}
        {loading ? (
          <p className="text-gray-400 text-center">Loading...</p>
        ) : shown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((r) => <ReportCard key={r._id} report={r} />)}
          </div>
        ) : (
          !error && (
            <p className="text-gray-400 text-center">
              {scope === "mine" ? "You haven't submitted any reports yet." : "No reports to display."}
            </p>
          )
        )}
      </section>
      <footer className="w-full bg-gray-800 py-4 text-gray-400 text-center">
        <p>&copy; 2024 Grievance Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Track;
