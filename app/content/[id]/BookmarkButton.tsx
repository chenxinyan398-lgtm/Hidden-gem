'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleBookmark } from './actions';

export default function BookmarkButton({
  contentId,
  initialBookmarked,
}: {
  contentId: string;
  initialBookmarked: boolean;
}) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    setIsPending(true);
    try {
      await toggleBookmark(contentId, isBookmarked);
    } catch (e) {
      setIsBookmarked(!nextState);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-md ${
        isBookmarked
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
      }`}
    >
      <Heart size={15} className={isBookmarked ? 'fill-rose-500 text-rose-500' : ''} />
      <span>{isBookmarked ? '已收錄至願望清單' : '❤️ 收錄至願望清單'}</span>
    </button>
  );
}
