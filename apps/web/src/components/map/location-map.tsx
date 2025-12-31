"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin, Navigation } from "lucide-react";

interface LocationMapProps {
  latitude: number | string;
  longitude: number | string;
  name?: string;
  address?: string;
  height?: string;
}

export function LocationMap({
  latitude,
  longitude,
  name = "الموقع",
  address,
  height = "400px",
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Coerce to numbers and guard against invalid inputs
  const toNumber = (v: number | string | undefined, fallback: number) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
    const parsed = parseFloat(v ?? '')
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const latNum = toNumber(latitude, 33.5138);
  const lonNum = toNumber(longitude, 36.2765);

  const escape = (value?: string) =>
    (value ?? "").replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

  useEffect(() => {
    if (!mapRef.current) return;

    (async () => {
      if (typeof window === 'undefined') return;
      const LeafletModule: any = await import('leaflet');
      const L = LeafletModule.default ?? LeafletModule;

      // Ensure default marker assets resolve correctly in bundler
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: marker2x.src ?? marker2x,
        iconUrl: marker.src ?? marker,
        shadowUrl: markerShadow.src ?? markerShadow,
      });

      // Cleanup previous instance if exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([latNum, lonNum], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const safeName = escape(name || "الموقع");
      const safeAddress = escape(address || "");

      const markerInstance = L.marker([latNum, lonNum]).addTo(map);
      if (safeName || safeAddress) {
        markerInstance.bindPopup(
          `<div style="font-family: sans-serif;">` +
            `<strong>${safeName}</strong>` +
            (safeAddress ? `<div style="color:#555; margin-top:4px;">${safeAddress}</div>` : "") +
          `</div>`
        );
      }

      mapInstanceRef.current = map;
    })();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [latNum, lonNum, name, address]);

  const handleOpenInMaps = () => {
    // Open in Google Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${latNum},${lonNum}`, "_blank");
  };

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        style={{ height, width: "100%" }}
        className="rounded-xl overflow-hidden border border-gray-200"
      />
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>
            {Number.isFinite(latNum) ? latNum.toFixed(6) : '—'}, {Number.isFinite(lonNum) ? lonNum.toFixed(6) : '—'}
          </span>
        </div>
        <button
          onClick={handleOpenInMaps}
          className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <Navigation className="w-4 h-4" />
          عرض في خرائط غوغل
        </button>
      </div>
    </div>
  );
}
