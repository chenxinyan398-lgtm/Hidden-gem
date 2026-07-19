'use client';

import { MessageSquare, MapPin, Utensils, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LocationPicker from '@/app/create/LocationPicker';
import PhotoInput from '@/app/create/PhotoInput';
import CulinaryInputs from '@/app/create/CulinaryInputs';
import { updateContent } from '../actions';

interface EditFormProps {
  content: any;
  errorMessage?: string;
}

export default function EditForm({ content, errorMessage }: EditFormProps) {
  const isSpot = content.type?.toUpperCase() === 'SPOT';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateContent(content.id, formData);
  };

  return (
    <div className="flex flex-col flex-1 p-6 pb-24">
      <div className="flex items-center justify-between mb-6 mt-2">
        <Link href={`/content/${content.id}`} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
          <ArrowLeft size={18} />
          <span>取消編輯</span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-zinc-900 border-zinc-800 text-zinc-300">
          {isSpot ? '📍 編輯景點筆記' : '🍳 編輯料理筆記'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium pl-1 text-zinc-300">
            {isSpot ? '景點標題' : '餐廳 / 料理名稱'}
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={content.title || ''}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-white"
          />
        </div>

        {/* Location Picker */}
        <LocationPicker
          initialAddress={content.address || ''}
          initialLat={content.latitude}
          initialLng={content.longitude}
        />

        {/* Photos */}
        <PhotoInput initialPhotos={content.photos || []} />

        {/* Spot or Culinary fields */}
        {isSpot ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recommendation" className="text-sm font-medium pl-1 text-zinc-300 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-amber-400" />
              景點私房心得與建議 <span className="text-xs text-zinc-500 font-normal">(選填)</span>
            </label>
            <textarea
              id="recommendation"
              name="recommendation"
              defaultValue={content.recommendation || ''}
              className="w-full min-h-[90px] rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-white resize-none"
            />
          </div>
        ) : (
          <CulinaryInputs
            initialBookingUrl={content.booking_url || ''}
            initialPriceRange={content.price_range || ''}
            initialRecommendedDishes={content.recommended_dishes || ''}
            initialDiningReview={content.dining_review || ''}
          />
        )}

        {/* Content Body */}
        <div className="flex flex-col gap-1.5 flex-1">
          <label htmlFor="content" className="text-sm font-medium pl-1 text-zinc-300">
            詳細說明與備註 <span className="text-xs text-zinc-500 font-normal">(選填)</span>
          </label>
          <textarea
            id="content"
            name="content"
            defaultValue={content.body || ''}
            className="w-full flex-1 min-h-[100px] rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all text-white resize-none"
          />
        </div>

        {/* Strictly Private Switch */}
        <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-inner">
          <div>
            <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              🔒 設為個人極密筆記
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              開啟後，即便朋友掃描您的 QR Code 亦無法讀取此手帳
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="is_private"
              value="true"
              defaultChecked={content.is_private || false}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-2xl hover:bg-amber-300 transition-all shadow-xl"
        >
          儲存手帳變更
        </button>
      </form>
    </div>
  );
}
