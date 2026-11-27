"use client";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

function FitReports({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 13);
  }, [map, points]);
  return null;
}

export default function ReportMap({ reports }) {
  const located = useMemo(
    () => reports.filter((report) => Number.isFinite(report.location?.latitude) && Number.isFinite(report.location?.longitude)),
    [reports],
  );
  const center = located.length ? [located[0].location.latitude, located[0].location.longitude] : [12.9716, 77.5946];
  const points = useMemo(
    () => located.map((report) => [report.location.latitude, report.location.longitude]),
    [located],
  );
  return <MapContainer center={center} zoom={located.length ? 12 : 11} scrollWheelZoom className="public-map-canvas"><FitReports points={points}/><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{located.map((report) => <Marker key={report.id} position={[report.location.latitude, report.location.longitude]}><Popup><strong>{report.title}</strong><br/>{report.city}, {report.area}<br/>Status: {report.status}</Popup></Marker>)}</MapContainer>;
}
