import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import ReportCard from "../components/ReportCard";
import { API_URL } from "../auth";
import { statusOf } from "../status";

// Reports that authorities have acted on (status changed, note added or proof uploaded)
const hasResponse = (r) =>
  statusOf(r) !== "Pending" || Boolean(r.responseProof) || (r.statusUpdates?.length || 0) > 1;

function Responses() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/reports`)
      .then(({ data }) =>
        setReports(
          data
            .filter(hasResponse)
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        )
      )
      .catch(() => setError("Failed to load government responses."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <NavBar />
      <section className="container mx-auto px-4 py-10 flex-grow">
        <h2 className="text-4xl font-bold text-blue-400 mb-2 text-center">Government Response</h2>
        <p className="text-gray-400 mb-8 text-center">
          Latest actions taken by local authorities on reported issues, with their proof of work.
        </p>
        {error && <p className="text-red-400 text-center">{error}</p>}
        {loading ? (
          <p className="text-gray-400 text-center">Loading...</p>
        ) : reports.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => <ReportCard key={r._id} report={r} />)}
          </div>
        ) : (
          !error && <p className="text-gray-400 text-center">Authorities have not responded to any reports yet.</p>
        )}
      </section>
    </div>
  );
}

export default Responses;
