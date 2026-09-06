import React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";

const pin = L.divIcon({ className: "", html: '<div style="background:#2a4898;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>', iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28] });
const centerIcon = L.divIcon({ className: "", html: '<div style="background:#e9483e;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(233,72,62,.35)"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });

function ClickPicker({ onPick }) { useMapEvents({ click(e) { onPick?.([e.latlng.lat, e.latlng.lng]); } }); return null; }

export default function SchoolMap({ schools, center = null, radius = null, onPick = null }) {
  const navigate = useNavigate();
  const pts = schools.filter((s) => s.lat != null && s.lng != null);
  const mapCenter = center || (pts[0] ? [pts[0].lat, pts[0].lng] : [14.4974, -14.4524]);
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm" data-testid="school-map-view">
      <MapContainer center={mapCenter} zoom={center ? 11 : pts.length > 3 ? 7 : 11} style={{ height: 480, width: "100%" }} scrollWheelZoom>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {onPick && <ClickPicker onPick={onPick} />}
        {center && radius && <><Circle center={center} radius={radius * 1000} pathOptions={{ color: "#e9483e", fillColor: "#e9483e", fillOpacity: 0.12 }} /><Marker position={center} icon={centerIcon} /></>}
        {pts.map((s) => (
          <Marker key={s.school_id} position={[s.lat, s.lng]} icon={pin}>
            <Popup><div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#2a4898" }}>{s.school_type} · {s.city || s.region}{s.distance_km != null ? ` · ${s.distance_km} km` : ""}</div>
              <div style={{ fontSize: 12, margin: "4px 0" }}>{(s.levels || []).join(" · ")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button data-testid={`map-view-school-${s.school_id}`} onClick={() => navigate(`/ecoles/${s.slug}`)} style={{ flex: 1, background: "#2a4898", color: "#fff", border: 0, borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>Voir l'école</button>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", border: "1px solid #2a4898", color: "#2a4898", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>Itinéraire</a>
              </div>
            </div></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
