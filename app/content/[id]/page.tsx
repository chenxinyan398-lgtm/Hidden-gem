import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Lock, MapPin, ArrowLeft, Navigation, MessageSquare, Compass, Stamp, UserCheck, Utensils, UtensilsCrossed, Sparkles, DollarSign, HeartHandshake, Edit3 } from 'lucide-react';
import Link from 'next/link';
import PhotoGallery from './PhotoGallery';
import DeleteButton from './DeleteButton';
import BookmarkButton from './BookmarkButton';
import CommentSection from './CommentSection';

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Get content with author profile
  const { data: content, error } = await supabase
    .from('contents')
    .select(`
      *,
      users:user_id (
        username,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !content) {
    return (
      <div className="flex flex-col flex-1 p-6 items-center justify-center text-center">
        <div className="bg-zinc-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-zinc-500 border border-zinc-800 shadow-inner">
          <Lock size={24} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">無法開啟此筆記</h1>
        <p className="text-zinc-400 text-sm mb-6">您尚未取得此手帳的讀取授權，或是該筆記已關閉。</p>
        <Link href="/" className="text-xs font-semibold bg-zinc-800 text-white px-6 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors">
          返回手帳架
        </Link>
      </div>
    );
  }

  const isOwner = content.user_id === user.id;
  const authorName = content.users?.username || '私房友';
  const isSpot = content.type?.toUpperCase() === 'SPOT';

  // Check if bookmarked
  const { data: bookmarkData } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('content_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const isBookmarked = !!bookmarkData;

  // Fetch comments safely
  let comments: any[] = [];
  try {
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (
          username
        )
      `)
      .eq('content_id', id)
      .order('created_at', { ascending: true });
    comments = commentsData || [];
  } catch (e) {
    // Graceful fallback if table is not migrated yet
  }

  // Build Google Maps navigation link
  let mapsNavUrl: string | null = null;
  if (content.latitude && content.longitude) {
    mapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${content.latitude},${content.longitude}`;
  } else if (content.address) {
    mapsNavUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.address)}`;
  }

  // Format booking link
  let bookingHref: string | null = null;
  if (content.booking_url) {
    if (content.booking_url.startsWith('http://') || content.booking_url.startsWith('https://')) {
      bookingHref = content.booking_url;
    } else {
      bookingHref = `tel:${content.booking_url}`;
    }
  }

  return (
    <div className="flex flex-col flex-1 pb-24 bg-zinc-950 min-h-screen">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 p-4 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
          <ArrowLeft size={18} />
          <span>返回手帳列表</span>
        </Link>
        <div className="flex items-center gap-2">
          {isSpot ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
              <MapPin size={13} />
              📍 景點手帳
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <Utensils size={13} />
              🍳 私房料理
            </span>
          )}

          {isOwner && (
            <Link
              href={`/content/${id}/edit`}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Edit3 size={12} />
              編輯
            </Link>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 max-w-md mx-auto w-full">
        {sParams?.message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl mb-4 text-center">
            {sParams.message}
          </div>
        )}

        {/* Author Stamp Banner & Bookmark Action */}
        <div className="mb-6 flex items-center justify-between bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              {isOwner ? <UserCheck size={20} /> : <Stamp size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                {isOwner ? (content.is_private ? '🔒 個人極密筆記' : 'AUTHOR / 您的個人手帳') : 'FRIEND\'S JOURNAL / 讀取朋友手帳'}
              </p>
              <h3 className="font-bold text-zinc-100 text-sm">
                {isOwner ? '我的專屬私房筆記' : `來自 【${authorName}】 的私房隨身手帳`}
              </h3>
            </div>
          </div>

          <BookmarkButton contentId={id} initialBookmarked={isBookmarked} />
        </div>

        {/* Photos Carousel */}
        {content.photos && content.photos.length > 0 && (
          <PhotoGallery photos={content.photos} />
        )}

        {/* Notebook Page Body Container */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative mb-6">
          {/* Notebook Binding Ring Accents */}
          <div className="absolute top-4 left-3 flex flex-col gap-1.5 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-700" />
          </div>

          <div className="pl-3">
            {/* Title & Created Date */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight leading-snug">
                {content.title}
              </h1>
              {!isSpot && content.price_range && (
                <span className="shrink-0 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <DollarSign size={12} />
                  {content.price_range}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mb-6 border-b border-zinc-800/80 pb-3">
              撰寫時間：{new Date(content.created_at).toLocaleString()}
            </p>

            {/* --- SPOT SPECIFIC FEATURES --- */}
            {isSpot && (
              <>
                {/* Location Info & Quick Navigation Button */}
                {(content.address || (content.latitude && content.longitude)) && (
                  <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 mb-6 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl mt-0.5">
                        <Compass size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">地點標記位置</h4>
                        <p className="text-xs font-medium text-zinc-200 leading-snug">
                          {content.address || `GPS 座標 (${content.latitude?.toFixed(4)}, ${content.longitude?.toFixed(4)})`}
                        </p>
                      </div>
                    </div>

                    {mapsNavUrl && (
                      <a
                        href={mapsNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-xs shadow-lg shadow-rose-950/50 mt-1"
                      >
                        <Navigation size={15} />
                        開啟 Google Maps 路線導航
                      </a>
                    )}
                  </div>
                )}

                {/* Spot Recommendation */}
                {content.recommendation && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-2">
                      <MessageSquare size={15} />
                      <span>【景點私房親身體驗與推薦】</span>
                    </div>
                    <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {content.recommendation}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* --- CULINARY (DISH) SPECIFIC FEATURES --- */}
            {!isSpot && (
              <>
                {/* Restaurant Booking Button */}
                {bookingHref && (
                  <div className="mb-6">
                    <a
                      href={bookingHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors text-xs shadow-lg shadow-emerald-950/50"
                    >
                      <UtensilsCrossed size={16} />
                      🍽️ 立即開啟餐廳訂位 / 預約
                    </a>
                  </div>
                )}

                {/* Restaurant Address & Google Maps Navigation Button */}
                {(content.address || (content.latitude && content.longitude)) && (
                  <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 mb-6 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl mt-0.5">
                        <Compass size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">餐廳地址位置</h4>
                        <p className="text-xs font-medium text-zinc-200 leading-snug">
                          {content.address || `GPS 座標 (${content.latitude?.toFixed(4)}, ${content.longitude?.toFixed(4)})`}
                        </p>
                      </div>
                    </div>

                    {mapsNavUrl && (
                      <a
                        href={mapsNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-xs shadow-lg shadow-emerald-950/50 mt-1"
                      >
                        <Navigation size={15} />
                        開啟 Google Maps 導航前往餐廳
                      </a>
                    )}
                  </div>
                )}

                {/* Recommended Dishes Card */}
                {content.recommended_dishes && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-2">
                      <Sparkles size={15} />
                      <span>【主廚推薦與招牌必點餐點】</span>
                    </div>
                    <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                      {content.recommended_dishes}
                    </p>
                  </div>
                )}

                {/* Dining Review / Post-Meal Impression */}
                {content.dining_review && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-2">
                      <HeartHandshake size={15} />
                      <span>【餐後感想與口感氛圍評語】</span>
                    </div>
                    <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {content.dining_review}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Detailed Body Content */}
            {content.body && (
              <div className="pt-2">
                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">詳細說明備註</h4>
                <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {content.body}
                </div>
              </div>
            )}

            {/* Owner Delete Option */}
            {isOwner && (
              <DeleteButton contentId={content.id} title={content.title} />
            )}
          </div>
        </div>

        {/* Comment & Social Reactions Section */}
        <CommentSection contentId={id} comments={comments} />
      </div>
    </div>
  );
}
