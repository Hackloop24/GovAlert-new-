import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import NavBar from "../components/NavBar";
import { API_URL, fileUrl } from "../auth";
import { STATUSES, STATUS_COLOR, STATUS_STYLE, placeOf, statusOf } from "../status";

const INDIA_CENTER = [22.5, 79];

// Zooms the map to fit all visible markers
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function MapView() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/api/reports`)
      .then(({ data }) => setReports(data))
      .catch(() => setError("Failed to load reports."));
  }, []);

  const pinned = reports.filter((r) => r.location?.lat != null && r.location?.lng != null);
  const shown = filter === "All" ? pinned : pinned.filter((r) => statusOf(r) === filter);
  const shownKey = shown.map((r) => r._id).join(",");
  // recompute (and re-zoom) only when the set of visible markers changes
  const points = useMemo(() => shown.map((r) => [r.location.lat, r.location.lng]), [shownKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <NavBar />
      <section className="container mx-auto px-4 py-8 flex-grow">
        <h2 className="text-3xl font-bold text-blue-400 mb-2 text-center">Map of Reported Issues</h2>
        <p className="text-gray-400 mb-6 text-center">
          {pinned.length} of {reports.length} reports have a pinned location.
          Click a marker to see details.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {["All", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${filter === s ? "bg-gray-200 text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              {s !== "All" && <span className="inline-block rounded-full" style={{ width: 10, height: 10, background: STATUS_COLOR[s] }}></span>}
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <div className="rounded-lg overflow-hidden shadow-lg" style={{ height: "65vh" }}>
          <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {shown.map((r) => {
              const status = statusOf(r);
              const proof = r.proofs?.[0] || r.proof;
              return (
                <CircleMarker key={r._id} center={[r.location.lat, r.location.lng]} radius={9}
                              pathOptions={{ color: "#fff", weight: 2, fillColor: STATUS_COLOR[status], fillOpacity: 0.9 }}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <strong>#{r.queryNumber}</strong>
                      <span className={`ml-2 text-xs font-semibold py-0.5 px-2 rounded-full ${STATUS_STYLE[status]}`}>{status}</span>
                      <p style={{ margin: "6px 0" }}>{r.description}</p>
                      <small>{placeOf(r)}</small><br />
                      <small>Reported {new Date(r.createdAt).toLocaleDateString("en-IN")}</small>
                      {proof && <><br /><a href={fileUrl(proof)} target="_blank" rel="noreferrer">View proof</a></>}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}

export default MapView;
