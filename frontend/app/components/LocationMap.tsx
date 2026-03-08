"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with webpack
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationMapProps {
  coordinates: string;
  onCoordinatesChange: (coords: string) => void;
}

export default function LocationMap({ coordinates, onCoordinatesChange }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
      }
    }
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onCoordinatesChange(`${lat.toFixed(6)},${lng.toFixed(6)}`);
  };

  return (
    <div className="space-y-3">
      <div className="h-72 rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>
      </div>
      {position ? (
        <p className="text-xs font-bold text-green-800 flex items-center gap-2">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Pin set: {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </p>
      ) : (
        <p className="text-xs font-medium text-slate-300 italic">Click the map to place a pin on your farm location.</p>
      )}
    </div>
  );
}
