import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const INDIA_CENTER = [22.5, 79];

function ClickToPick({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FlyTo({ value }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, value]);
  return null;
}

// Lets the user drop a pin by clicking the map or using their device location
function LocationPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) return setMessage("Location is not supported by this browser.");
    setBusy(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(point);
        setFlyTarget(point);
        setBusy(false);
      },
      () => {
        setMessage("Could not get your location. Click on the map instead.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-gray-200">
          Pin the location <span className="text-gray-500">(click the map or use your location - fills the address below)</span>
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={useMyLocation} disabled={busy}
                  className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm">
            <i className="fa-solid fa-location-crosshairs mr-1"></i>{busy ? "Locating..." : "Use my location"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)}
                    className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm">
              Clear pin
            </button>
          )}
        </div>
      </div>
      <div className="rounded-md overflow-hidden" style={{ height: 300 }}>
        <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPick onPick={onChange} />
          <FlyTo value={flyTarget} />
          {value && (
            <CircleMarker center={[value.lat, value.lng]} radius={10}
                          pathOptions={{ color: "#fff", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.9 }} />
          )}
        </MapContainer>
      </div>
      {value && (
        <p className="text-gray-400 text-sm mt-1">
          Pinned at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
      {message && <p className="text-yellow-400 text-sm mt-1">{message}</p>}
    </div>
  );
}

export default LocationPicker;
