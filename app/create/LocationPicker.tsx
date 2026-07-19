'use client';

import { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
}

export default function LocationPicker({
  initialAddress = '',
  initialLat = null,
  initialLng = null,
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(
    initialLat && initialLng ? `已記錄 GPS：${initialLat.toFixed(4)}, ${initialLng.toFixed(4)}` : null
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('此裝置或瀏覽器不支援 GPS 定位');
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setIsLocating(false);
        setLocationStatus(`已定位：${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        
        if (!address) {
          setAddress(`GPS 專屬位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationStatus('定位失敗：請確認已給予瀏覽器相機/位置存取權限');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationStatus('定位失敗：無法取得目前位置資訊');
            break;
          case error.TIMEOUT:
            setLocationStatus('定位失敗：請求逾時，請再試一次');
            break;
          default:
            setLocationStatus('定位失敗：未知錯誤');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
          <MapPin size={16} className="text-rose-400" />
          地圖位置標記
        </label>
        
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Navigation size={13} />
          )}
          {isLocating ? '定位中...' : '📍 擷取目前位置'}
        </button>
      </div>

      <input
        type="text"
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="模式 A：請輸入地址/地名 (例如: 台北市士林區平菁街)"
        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
      />

      {locationStatus && (
        <div className={`text-xs flex items-center gap-1.5 ${coords ? 'text-emerald-400' : 'text-amber-400'}`}>
          {coords && <CheckCircle2 size={13} />}
          <span>{locationStatus}</span>
        </div>
      )}

      {/* Hidden fields for coordinates */}
      <input type="hidden" name="latitude" value={coords?.lat ?? ''} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ''} />
    </div>
  );
}
