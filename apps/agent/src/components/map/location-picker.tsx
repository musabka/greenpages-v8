"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

export function LocationPicker({ latitude, longitude, onLocationChange, height = "400px" }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLat, setCurrentLat] = useState(latitude ?? 33.5138);
  const [currentLng, setCurrentLng] = useState(longitude ?? 36.2765);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: marker2x.src ?? marker2x,
      iconUrl: marker.src ?? marker,
      shadowUrl: markerShadow.src ?? markerShadow,
    });

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([currentLat, currentLng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const markerInstance = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
    markerInstance.on("dragend", () => {
      const { lat, lng } = markerInstance.getLatLng();
      console.log('🖱️ Marker dragged to:', { lat, lng });
      updateMarkerPosition(lat, lng, false);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarkerPosition(lat, lng, true);
    });

    markerRef.current = markerInstance;
    mapInstanceRef.current = map;
  }, []);

  // Sync external coords into map
  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    if (Math.abs(latitude - currentLat) < 0.00001 && Math.abs(longitude - currentLng) < 0.00001) return;
    console.log('🔄 Syncing external coords:', { latitude, longitude });
    setCurrentLat(latitude);
    setCurrentLng(longitude);
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  const updateMarkerPosition = (lat: number, lng: number, center = false) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (center && mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
    onLocationChange(lat, lng);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم تحديد الموقع الجغرافي");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        updateMarkerPosition(newLat, newLng, true);
        setIsLocating(false);
      },
      () => {
        alert("فشل في الحصول على موقعك الحالي");
        setIsLocating(false);
      }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=sy&q=${encodeURIComponent(searchQuery)}`,
        { headers: { "Accept-Language": "ar", "User-Agent": "greenpages-admin/1.0" } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        updateMarkerPosition(lat, lng, true);
      } else {
        alert("لم يتم العثور على نتائج للبحث");
      }
    } catch (err) {
      console.error("Search error", err);
      alert("حدث خطأ أثناء البحث");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={handleSearch}>
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن عنوان أو مكان (باستخدام OpenStreetMap)"
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          بحث
        </button>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={isLocating}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          موقعي الحالي
        </button>
      </form>

      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="rounded-xl overflow-hidden border border-gray-200"
      />

      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">الإحداثيات:</span>
          <code className="bg-white px-2 py-1 rounded border border-gray-200">
            {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
          </code>
        </div>
        <div className="text-xs text-gray-500">اضغط على الخريطة أو اسحب العلامة لتغيير الموقع</div>
      </div>
    </div>
  );
}
