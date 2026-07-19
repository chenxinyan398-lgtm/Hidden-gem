'use client';

import { useState } from 'react';
import { UtensilsCrossed, Sparkles, DollarSign, HeartHandshake } from 'lucide-react';

interface CulinaryInputsProps {
  initialBookingUrl?: string;
  initialPriceRange?: string;
  initialRecommendedDishes?: string;
  initialDiningReview?: string;
}

export default function CulinaryInputs({
  initialBookingUrl = '',
  initialPriceRange = '',
  initialRecommendedDishes = '',
  initialDiningReview = '',
}: CulinaryInputsProps) {
  const [bookingUrl, setBookingUrl] = useState(initialBookingUrl);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [recommendedDishes, setRecommendedDishes] = useState(initialRecommendedDishes);

  const quickPrices = [
    'NT$ 200 - 500 / 人',
    'NT$ 500 - 1000 / 人',
    'NT$ 1000 - 2000 / 人',
    'NT$ 2000+ / 高級無菜單',
  ];

  return (
    <div className="flex flex-col gap-4 bg-zinc-900/60 border border-emerald-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 border-b border-zinc-800/80 pb-2">
        <UtensilsCrossed size={16} />
        <span>私房料理特有資訊</span>
      </div>

      {/* Booking URL */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="booking_url" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <UtensilsCrossed size={13} className="text-emerald-400" />
          餐廳訂位網址 / 預約電話
        </label>
        <input
          id="booking_url"
          name="booking_url"
          type="text"
          value={bookingUrl}
          onChange={(e) => setBookingUrl(e.target.value)}
          placeholder="例如：https://inline.app/... 或 預約專線 (02)2721-xxxx"
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="price_range" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <DollarSign size={13} className="text-emerald-400" />
          大概人均價位
        </label>
        <input
          id="price_range"
          name="price_range"
          type="text"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          placeholder="例如：NT$ 800 - 1200 / 人"
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
        <div className="flex flex-wrap gap-1.5 mt-1">
          {quickPrices.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => setPriceRange(price)}
              className="text-[11px] bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 text-zinc-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              {price}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Dishes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recommended_dishes" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" />
          招牌必點餐點推薦
        </label>
        <input
          id="recommended_dishes"
          name="recommended_dishes"
          type="text"
          value={recommendedDishes}
          onChange={(e) => setRecommendedDishes(e.target.value)}
          placeholder="例如：海膽干貝燉飯、主廚手作黑松露提拉米蘇"
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
      </div>

      {/* Dining Review */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dining_review" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <HeartHandshake size={13} className="text-emerald-400" />
          餐後感想與氛圍評價
        </label>
        <textarea
          id="dining_review"
          name="dining_review"
          defaultValue={initialDiningReview}
          className="w-full min-h-[80px] rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
          placeholder="口感層次、侍酒感受、包廂環境或回訪評語..."
        />
      </div>
    </div>
  );
}
