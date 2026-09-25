"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { IPOSDeviceLocation } from "@/interfaces/writers.interface";
import ChartColors from "@/utils/chart-colors";

// Fix leaflet's default marker icon broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function statusColor(writerStatus: string): string {
  const s = writerStatus.toLowerCase();
  if (s === "active") return ChartColors.success;
  if (s === "no_use" || s === "no use") return ChartColors.danger;
  return ChartColors.axis;
}

function makeIcon(writerStatus: string) {
  const color = statusColor(writerStatus);
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`);
  return L.divIcon({
    html: `<img src="data:image/svg+xml,${svg}" width="24" height="36" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))"/>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    className: "",
  });
}

function FitBounds({ devices }: { devices: IPOSDeviceLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (devices.length === 0) return;
    const bounds = L.latLngBounds(
      devices.map((d) => [parseFloat(d.latitude), parseFloat(d.longitude)]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [devices, map]);
  return null;
}

function timeSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  devices: IPOSDeviceLocation[];
  onWriterClick: (writerId: string) => void;
}

export default function DeviceMapInner({ devices, onWriterClick }: Props) {
  const center: [number, number] =
    devices.length > 0
      ? [parseFloat(devices[0].latitude), parseFloat(devices[0].longitude)]
      : [5.614818, -0.205874]; // Accra default

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds devices={devices} />
      {devices.map((d) => (
        <Marker
          key={d.id}
          position={[parseFloat(d.latitude), parseFloat(d.longitude)]}
          icon={makeIcon(d.writer.status)}
        >
          <Popup minWidth={220}>
            <div className="text-xs space-y-1.5 py-1">
              <button
                onClick={() => onWriterClick(d.writer.id)}
                className="font-semibold text-sm text-foreground underline underline-offset-2 decoration-gray-400 hover:text-primary hover:decoration-primary transition-colors text-left cursor-pointer"
              >
                {d.writer.name}
              </button>
              <p className="text-muted-foreground">
                Writer #{d.writer.writer_id}
              </p>
              {d.writer.phone && (
                <p className="text-muted-foreground">{d.writer.phone}</p>
              )}
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: statusColor(d.writer.status) }}
                />
                <span className="capitalize text-foreground">
                  {d.writer.status.replace(/_/g, " ")}
                </span>
              </div>
              <hr className="border-border my-1" />
              <p className="text-muted-foreground">
                <span className="font-medium">Device Serial No:</span>{" "}
                {d.serial_number}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Type:</span>{" "}
                <span className="uppercase">{d.device_type}</span>
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{d.status}</span>
              </p>
              {d.location_accuracy_m && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Accuracy:</span> ±
                  {d.location_accuracy_m}m
                </p>
              )}
              <p className="text-zinc-400 text-[11px]">
                Last seen {timeSince(d.location_reported_at)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
