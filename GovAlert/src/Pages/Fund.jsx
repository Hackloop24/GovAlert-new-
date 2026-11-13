// src/Pages/Fund.jsx - Transparency: public statistics and fund utilisation
import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { API_URL } from "../auth";
import { STATUSES, STATUS_COLOR, formatINR, placeOf, statusOf } from "../status";

function Stat({ label, value, color }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-center">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-2xl font-bold" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

const Fund = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([axios.get(`${API_URL}/api/stats`), axios.get(`${API_URL}/api/reports`)])
      .then(([s, r]) => {
        setStats(s.data);
        setReports(r.data.filter((x) => (x.fund?.allocated || 0) > 0));
      })
      .catch(() => setError("Failed to load transparency data."));
  }, []);

  const used = stats ? stats.funds.utilized : 0;
  const allocated = stats ? stats.funds.allocated : 0;
  const usedPct = allocated ? Math.round((used / allocated) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <NavBar />
      <section className="container mx-auto px-4 py-10 flex-grow max-w-6xl">
        <h1 className="text-4xl font-bold text-blue-400 mb-2 text-center">Transparency</h1>
        <p className="text-gray-400 mb-8 text-center">
          Public figures on reported issues and how allocated funds are being utilised.
        </p>
        {error && <p className="text-red-400 text-center mb-6">{error}</p>}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Stat label="Total reports" value={stats.total} />
              {STATUSES.map((s) => <Stat key={s} label={s} value={stats.status[s]} color={STATUS_COLOR[s]} />)}
              <Stat label="Resolution rate" value={`${stats.resolvedRate}%`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Stat label="Funds allocated" value={formatINR(allocated)} />
              <Stat label="Funds utilised" value={formatINR(used)} />
              <Stat label="Funds remaining" value={formatINR(allocated - used)} />
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-10">
              <div className="h-3 rounded-full bg-green-500" style={{ width: `${usedPct}%` }}></div>
            </div>
          </>
        )}

        <h2 className="text-2xl font-semibold text-blue-300 mb-4">Funds Allocation and Utilisation</h2>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-gray-800 rounded-lg shadow-lg text-left">
            <thead>
              <tr className="bg-gray-700 text-white">
                <th className="py-3 px-4">Query No.</th>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Utilised</th>
                <th className="py-3 px-4">Remaining</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {reports.length ? (
                reports.map((r) => (
                  <tr key={r._id} className="border-b border-gray-700">
                    <td className="py-2 px-4 whitespace-nowrap">{r.queryNumber}</td>
                    <td className="py-2 px-4">
                      {r.description}
                      <div className="text-gray-500 text-sm">{placeOf(r)}</div>
                    </td>
                    <td className="py-2 px-4" style={{ color: STATUS_COLOR[statusOf(r)] }}>{statusOf(r)}</td>
                    <td className="py-2 px-4">{formatINR(r.fund.allocated)}</td>
                    <td className="py-2 px-4">{formatINR(r.fund.utilized)}</td>
                    <td className="py-2 px-4">{formatINR(r.fund.allocated - r.fund.utilized)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-400">
                    No funds have been allocated to reports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Fund;
