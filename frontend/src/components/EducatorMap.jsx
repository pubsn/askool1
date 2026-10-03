import React, { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Stars } from "@/components/common";

const REGION_COORDS = {
  Dakar: [14.7167, -17.4677], Thiès: [14.7910, -16.9256], "Saint-Louis": [16.0326, -16.4818],
  Diourbel: [14.6559, -16.2314], Ziguinchor: [12.5641, -16.2639], Kaolack: [14.1652, -16.0726],
  Touba: [14.8500, -15.8833], Rufisque: [14.7156, -17.2736], Mbour: [14.4198, -16.9646],
  Louga: [15.6144, -16.2244],
};

function hashJitter(id) {
  let h = 0;
  for (let i = 0; i < (id || "").length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return [((h % 100) - 50) / 900, (((h >> 4) % 100) - 50) / 900];
}

const blueIcon = L.divIcon({
  className: "",
  html: '<div style="background:#203c89;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
});

const centerIcon = L.divIcon({
  className: "",
  html: '<div style="background:#ee731f;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(233,72,62,.35)"></div>',
  iconSize: [20, 20], iconAnchor: [10, 10],
});

function ClickPicker({ onPick }) {
  useMapEvents({ click(e) { onPick?.([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

export default function EducatorMap({ educators, center = null, radius = null, onPick = null }) {
  const navigate = useNavigate();
  const markers = useMemo(() => educators.map((e) => {
    let pos;
    if (e.lat != null && e.lng != null) pos = [e.lat, e.lng];
    else {
      const base = REGION_COORDS[e.region] || REGION_COORDS.Dakar;
      const [dlat, dlng] = hashJitter(e.user_id);
      pos = [base[0] + dlat, base[1] + dlng];
    }
    return { ...e, pos };
  }), [educators]);

  const mapCenter = center || markers[0]?.pos || [14.4974, -14.4524];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm" data-testid="educator-map">
      <MapContainer center={mapCenter} zoom={center ? 10 : markers.length > 3 ? 7 : 12} style={{ height: 480, width: "100%" }} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {onPick && <ClickPicker onPick={onPick} />}
        {center && radius && (
          <>
            <Circle center={center} radius={radius * 1000} pathOptions={{ color: "#ee731f", fillColor: "#ee731f", fillOpacity: 0.12 }} />
            <Marker position={center} icon={centerIcon} />
          </>
        )}
        {markers.map((e) => (
          <Marker key={e.user_id} position={e.pos} icon={blueIcon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div className="flex items-center gap-2">
                  <img src={e.photo || e.avatar_url} alt={e.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: "#203c89" }}>{e.profession}</div>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1"><Stars value={e.rating} size={12} /><span style={{ fontSize: 11 }}>({e.reviews_count || 0})</span></div>
                <div style={{ fontSize: 13, margin: "4px 0" }}>{(e.hourly_rate || 0).toLocaleString()} FCFA/h · {e.location}{e.distance_km != null ? ` · ${e.distance_km} km` : ""}</div>
                <button data-testid={`map-view-${e.user_id}`} onClick={() => navigate(`/educateurs/${e.user_id}`)}
                  style={{ background: "#203c89", color: "#fff", border: 0, borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", width: "100%" }}>
                  Voir le profil
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
