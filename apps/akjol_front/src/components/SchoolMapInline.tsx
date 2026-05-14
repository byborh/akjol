"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { SchoolEntry } from "../data/schools";
import { getCoordsForCity } from "../data/geo";

type Props = {
  school: SchoolEntry;
  height?: number;
};

export default function SchoolMapInline({ school, height = 220 }: Props) {
  const coords: [number, number] | null =
    school.lat != null && school.lng != null
      ? [school.lat, school.lng]
      : getCoordsForCity(school.city);

  if (!coords) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-black/5" style={{ height }}>
      <MapContainer
        center={coords}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        dragging
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={coords}
          radius={10}
          pathOptions={{
            color: "#ee7768",
            fillColor: "#ee7768",
            fillOpacity: 0.65,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent>
            <strong>{school.name}</strong>
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
