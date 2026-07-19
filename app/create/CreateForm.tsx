'use client';

import { useState } from 'react';
import { MapPin, Utensils, MessageSquare } from 'lucide-react';
import LocationPicker from './LocationPicker';
import PhotoInput from './PhotoInput';
import CulinaryInputs from './CulinaryInputs';
import { createContent } from './actions';

export default function CreateForm({ errorMessage }: { errorMessage?: string }) {
  const [selectedType, setSelectedType] = useState<'spot' | 'dish'>('spot');

  return (
    <form action={createContent} className="flex-1 flex flex-col gap-5">
      {/* Type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium pl-1 text-zinc-300">請選擇手帳主題</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="relative flex cursor-pointer rounded-2xl bg-zinc-900 border border-zinc-800 p-4 focus-within:ring-2 focus-within:ring-rose-500/50 hover:bg-zinc-800/80 transition-all">
            <input
              type="radio"
              name="type"
              value="spot"
              checked={selectedType === 'spot'}
              onChange={() => setSelectedType('spot')}
              className="peer sr-only"
            />
            <div className="flex flex-col gap-1 items-center justify-center w-full text-zinc-400 peer-checked:text-rose-400 transition-colors">
              <MapPin size={24} />
              <span className="text-sm font-bold mt-1">📍 私房景點</span>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent peer-checked:border-rose-500/60 pointer-events-none transition-colors shadow-lg shadow-rose-950/20" />
          </label>

          <label className="relative flex cursor-pointer rounded-2xl bg-zinc-900 border border-zinc-800 p-4 focus-within:ring-2 focus-within:ring-emerald-500/50 hover:bg-zinc-800/80 transition-all">
            <input
              type="radio"
              name="type"
              value="dish"
              checked={selectedType === 'dish'}
              onChange={() => setSelectedType('dish')}
              className="peer sr-only"
            />
            <div className="flex flex-col gap-1 items-center justify-center w-full text-zinc-400 peer-checked:text-emerald-400 transition-colors">
              <Utensils size={24} />
              <span className="text-sm font-bold mt-1">🍳 私房料理</span>
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent peer-checked:border-emerald-500/60 pointer-events-none transition-colors shadow-lg shadow-emerald-950/20" />
          </label>
        </div>
      </div>

      {/* Dynamic Fields based on Topic */}
      {selectedType === 'spot' ? (
        /* SPOT SPECIFIC FIELDS */
        <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Spot Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium pl-1 text-zinc-300">景點手帳標題</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-white placeholder-zinc-600"
              placeholder="例如：陽明山後山秘密瀑布 / 台北陽台酒吧"
            />
          </div>

          {/* Location Picker */}
          <LocationPicker />

          {/* Spot Photos */}
          <PhotoInput />

          {/* Spot Recommendation */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recommendation" className="text-sm font-medium pl-1 text-zinc-300 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-amber-400" />
              景點私房心得與建議 <span className="text-xs text-zinc-500 font-normal">(選填)</span>
            </label>
            <textarea
              id="recommendation"
              name="recommendation"
              className="w-full min-h-[90px] rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-white placeholder-zinc-600 resize-none"
              placeholder="特別推薦原因、最佳到訪時間、防蚊穿著建議或入場眉角..."
            />
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="content" className="text-sm font-medium pl-1 text-zinc-300">
              景點詳細介紹與備註 <span className="text-xs text-zinc-500 font-normal">(選填)</span>
            </label>
            <textarea
              id="content"
              name="content"
              className="w-full flex-1 min-h-[100px] rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-white placeholder-zinc-600 resize-none"
              placeholder="環境特色、交通細節、開放時間備註等..."
            />
          </div>
        </div>
      ) : (
        /* CULINARY (DISH) SPECIFIC FIELDS */
        <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Restaurant Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium pl-1 text-zinc-300">餐廳 / 料理名稱</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder-zinc-600"
              placeholder="例如：隱爵士餐酒館 / 秘密深夜日式拉麵"
            />
          </div>

          {/* Restaurant Location Picker (Address & GPS) */}
          <LocationPicker />

          {/* Culinary Specific Inputs (Booking URL, Price, Dishes, Review) */}
          <CulinaryInputs />

          {/* Food Photos */}
          <PhotoInput />

          {/* Body */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="content" className="text-sm font-medium pl-1 text-zinc-300">
              料理/餐廳詳細介紹與備註 <span className="text-xs text-zinc-500 font-normal">(選填)</span>
            </label>
            <textarea
              id="content"
              name="content"
              className="w-full flex-1 min-h-[100px] rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-white placeholder-zinc-600 resize-none"
              placeholder="環境氛圍、交通停車資訊、營業時間備註等..."
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
          {errorMessage}
        </div>
      )}

      {/* Strictly Private Toggle */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mt-1 shadow-inner">
        <div>
          <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            🔒 設為個人極密筆記
          </h4>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            開啟後，即便朋友掃描您的 QR Code 亦無法讀取此手帳
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input type="checkbox" name="is_private" value="true" className="sr-only peer" />
          <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      <button
        type="submit"
        className={`w-full font-bold py-3.5 rounded-2xl transition-all mt-2 shadow-xl ${
          selectedType === 'spot'
            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-950/40'
            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-950/40'
        }`}
      >
        儲存{selectedType === 'spot' ? '📍 私房景點' : '🍳 私房料理'}手帳
      </button>
    </form>
  );
}
