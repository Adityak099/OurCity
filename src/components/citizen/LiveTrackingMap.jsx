"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

const driverIcon = L.divIcon({
  className: "live-map-marker live-map-marker-driver",
  html: "<span></span>",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const destinationIcon = L.divIcon({
  className: "live-map-marker live-map-marker-destination",
  html: "<span></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitTrackingBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 15, { animate: true });
    } else {
      map.fitBounds(positions, { padding: [32, 32], maxZoom: 16 });
    }
  }, [map, positions]);

  return null;
}

export default function LiveTrackingMap({ driverLocation, targetLocation }) {
  const positions = useMemo(() => {
    const points = [
      [driverLocation.latitude, driverLocation.longitude],
      [targetLocation.latitude, targetLocation.longitude],
    ];

    return points.filter(
      ([latitude, longitude]) =>
        Number.isFinite(latitude) && Number.isFinite(longitude),
    );
  }, [
    driverLocation.latitude,
    driverLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude,
  ]);

  if (positions.length === 0) return null;

  return (
    <div className="citizen-live-map">
      <MapContainer
        center={positions[0]}
        zoom={14}
        scrollWheelZoom={false}
        aria-label="Map showing the driver's live location and the reported waste location"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrackingBounds positions={positions} />
        <Marker position={positions[0]} icon={driverIcon}>
          <Popup>Driver&apos;s current location</Popup>
        </Marker>
        {positions.length > 1 && (
          <Marker position={positions[1]} icon={destinationIcon}>
            <Popup>Reported waste location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
