'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Navigation, MapPin, Utensils, Compass, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface NoteItem {
  id: string;
  title: string;
  type: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photos?: string[] | null;
  recommendation?: string | null;
  price_range?: string | null;
  users?: {
    username?: string | null;
  } | null;
}

export default function MapView({ items }: { items: NoteItem[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<any>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null); // null = all
  const [selectedItem, setSelectedItem] = useState<NoteItem | null>(null);

  // Calculate distance
  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} 公尺`;
    return `${(meters / 1000).toFixed(1)} 公里`;
  };

  // Locate user GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPos({ lat, lng });
        setIsLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 14);
        }
      },
      (error) => {
        setIsLocating(false);
        if (typeof window !== 'undefined' && window.isSecureContext === false) {
          alert('地圖定位需要 HTTPS 連線才能使用。若您使用手機測試，請確認您的網址為 HTTPS。');
        } else if (error.code === error.PERMISSION_DENIED) {
          alert('無法取得您的位置，請確認已在手機或瀏覽器中開啟定位權限。');
        } else {
          console.warn('Geolocation error:', error);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    handleLocateUser();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultLat = 25.033;
    const defaultLng = 121.5654;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([defaultLat, defaultLng], 12);

    // Dark tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // 點擊地圖空白處自動收起已選取的筆記卡片
    map.on('click', () => {
      setSelectedItem(null);
    });

    markersRef.current = L.featureGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render Markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    // User GPS Marker
    if (userPos) {
      const userIcon = L.divIcon({
        className: 'user-pin-marker',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <div class="absolute w-6 h-6 rounded-full bg-blue-500/40 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([userPos.lat, userPos.lng], { icon: userIcon })
        .addTo(markersRef.current)
        .bindTooltip('您的目前位置', { permanent: false, direction: 'top' });
    }

    // Items Markers
    items.forEach((item) => {
      if (item.latitude == null || item.longitude == null) return;
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      // Distance check
      if (userPos && radiusKm != null) {
        const distMeters = getDistanceInMeters(userPos.lat, userPos.lng, lat, lng);
        if (distMeters > radiusKm * 1000) return;
      }

      const typeUpper = (item.type || '').toUpperCase();
      const isSpot = typeUpper === 'SPOT';
      const bgClass = isSpot
        ? 'bg-rose-500 border-rose-300 shadow-rose-950/50'
        : 'bg-emerald-500 border-emerald-300 shadow-emerald-950/50';
      const iconSymbol = isSpot ? '📍' : '🍳';

      // 180px x 48px 完整包覆「圖標 + 右側名稱」的超大點擊熱區
      const pinIcon = L.divIcon({
        className: 'item-pin-marker-wrapper',
        html: `
          <div class="w-[180px] h-[48px] flex items-center justify-start cursor-pointer">
            <div class="flex items-center gap-1.5 ${bgClass} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-2xl border-2 shrink-0 select-none pointer-events-none">
              <span>${iconSymbol}</span>
              <span class="max-w-[100px] truncate">${item.title || '私房手帳'}</span>
            </div>
          </div>
        `,
        iconSize: [180, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(markersRef.current!);

      marker.on('click', (e: L.LeafletMouseEvent) => {
        if (e && e.originalEvent) {
          L.DomEvent.stopPropagation(e as any);
        }
        // 直接開啟底部手帳卡片，移除地圖 panTo 位移動畫，防止圖標「噴出去」
        setSelectedItem({ ...item });
      });
    });
  }, [items, userPos, radiusKm]);

  // Google Maps URL generator
  const getGoogleMapsNavUrl = (item: NoteItem) => {
    if (item.latitude && item.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
    }
    if (item.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`;
    }
    return null;
  };

  return (
    <div className="flex flex-col flex-1 h-screen relative overflow-hidden bg-zinc-950">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-3">
        <div className="flex items-center justify-between bg-zinc-950/85 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl shadow-2xl">
          <Link
            href="/"
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>

          <h1 className="font-bold text-white text-sm flex items-center gap-1.5">
            <Compass size={18} className="text-amber-400 animate-spin-slow" />
            附近私房探祕地圖
          </h1>

          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          </button>
        </div>

        {/* Radius Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: '全部秘境', km: null },
            { label: '500m 內', km: 0.5 },
            { label: '3km 內', km: 3 },
            { label: '10km 內', km: 10 },
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => setRadiusKm(pill.km)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all shrink-0 shadow-lg ${
                radiusKm === pill.km
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Selected Item Snapshot Card Overlay */}
      {selectedItem && (
        <div
          key={selectedItem.id}
          className="absolute bottom-20 left-4 right-4 z-30 animate-in slide-in-from-bottom-5 fade-in duration-200"
        >
          <div className="bg-zinc-900/95 border border-amber-500/30 backdrop-blur-md rounded-3xl p-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white text-xs bg-zinc-800/80 rounded-full w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-start gap-3">
              {/* Photo Thumbnail */}
              {selectedItem.photos && selectedItem.photos.length > 0 ? (
                <img
                  src={selectedItem.photos[0]}
                  alt={selectedItem.title}
                  className="w-20 h-20 rounded-2xl object-cover border border-zinc-800 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 border border-zinc-700">
                  {selectedItem.type?.toUpperCase() === 'SPOT' ? (
                    <MapPin size={24} className="text-rose-400" />
                  ) : (
                    <Utensils size={24} className="text-emerald-400" />
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    📖 來自 【{selectedItem.users?.username || '私房友'}】
                  </span>
                  {selectedItem.type?.toUpperCase() === 'SPOT' ? (
                    <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                      📍 景點
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                      🍳 料理
                    </span>
                  )}
                  {selectedItem.price_range && (
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                      {selectedItem.price_range}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-sm truncate mb-1">
                  {selectedItem.title}
                </h3>

                {userPos && selectedItem.latitude && selectedItem.longitude && (
                  <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Sparkles size={12} />
                    距離您：
                    {formatDistance(
                      getDistanceInMeters(
                        userPos.lat,
                        userPos.lng,
                        Number(selectedItem.latitude),
                        Number(selectedItem.longitude)
                      )
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link
                href={`/content/${selectedItem.id}`}
                className="flex items-center justify-center gap-1 bg-zinc-800 text-zinc-200 font-semibold text-xs py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                開啟完整手帳
              </Link>

              {getGoogleMapsNavUrl(selectedItem) && (
                <a
                  href={getGoogleMapsNavUrl(selectedItem)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-lg shadow-rose-950/50"
                >
                  <Navigation size={14} />
                  Google Maps 導航
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
