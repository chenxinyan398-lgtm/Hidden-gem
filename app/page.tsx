import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Utensils, BookOpen, Users, Plus, Compass, List, User, Heart, Search, Lock } from 'lucide-react';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; friendId?: string; q?: string; success?: string; deleted?: string; message?: string }>
}) {
  const params = await searchParams;
  const currentTab = params?.tab || 'my';
  const selectedFriendId = params?.friendId || null;
  const searchQuery = (params?.q || '').trim().toLowerCase();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch my contents
  let myContents: any[] = [];
  if (currentTab === 'my') {
    let query = supabase
      .from('contents')
      .select('id, title, type, user_id, created_at, address, recommended_dishes, photos, is_private, is_locked')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,recommended_dishes.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Fetch error:', error);
      myContents = [{ id: 'error-id', title: '⚠️ 資料讀取失敗', body: `無法載入您的筆記：${error.message}`, type: 'LIST' }];
    } else {
      myContents = data || [];
    }
  }

  // Fetch friends' contents & friends list if in 'friends' tab
  let friendsContents: any[] = [];
  let friendProfiles: { id: string; username: string }[] = [];

  if (currentTab === 'friends') {
    const { data: grants } = await supabase
      .from('access_grants')
      .select('content_id')
      .eq('grantee_user_id', user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const grantedContentIds = grants?.map((g) => g.content_id) || [];

    const { data: userGrants } = await supabase
      .from('user_grants')
      .select('owner_user_id')
      .eq('grantee_user_id', user.id);

    const validFriendIds = userGrants?.map((g) => g.owner_user_id) || [];

    // Filter by specific friend if selected
    const filterFriendIds = selectedFriendId === 'all' 
      ? validFriendIds 
      : (validFriendIds.includes(selectedFriendId) ? [selectedFriendId] : []);

    // Fetch friend profiles for filter bar using ALL valid friends, not just the selected one
    if (validFriendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, username')
        .in('id', validFriendIds);
      
      friendProfiles = (profiles || []).map((p) => ({
        id: p.id,
        username: p.username || '私房友',
      }));
    }

    // Query contents (filtering out strictly private notes)
    if (filterFriendIds.length > 0 || grantedContentIds.length > 0) {
      let contentsQuery = supabase
        .from('contents')
        .select(`
          id, title, type, user_id, created_at, address, recommended_dishes, photos, is_private, is_locked, body, recommendation, booking_url, price_range, dining_review,
          users:user_id (
            username,
            avatar_url
          )
        `)
        .or(`user_id.in.(${filterFriendIds.join(',') || '00000000-0000-0000-0000-000000000000'}),id.in.(${grantedContentIds.join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .or('is_private.is.null,is_private.eq.false')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        contentsQuery = contentsQuery.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,recommended_dishes.ilike.%${searchQuery}%`);
      }

      const { data } = await contentsQuery;
      friendsContents = data || [];
    }
  }

  // Fetch bookmarked contents if in 'bookmarks' tab
  let bookmarkedContents: any[] = [];
  if (currentTab === 'bookmarks') {
    try {
      const { data: bData } = await supabase
        .from('bookmarks')
        .select(`
          content_id,
          contents:content_id (
            *,
            users:user_id (
              username
            )
          )
        `)
        .eq('user_id', user.id);

      bookmarkedContents = (bData || []).map((b) => b.contents).filter(Boolean);

      if (searchQuery) {
        bookmarkedContents = bookmarkedContents.filter(
          (c) =>
            c.title?.toLowerCase().includes(searchQuery) ||
            c.address?.toLowerCase().includes(searchQuery) ||
            c.recommended_dishes?.toLowerCase().includes(searchQuery)
        );
      }
    } catch (e) {
      // Fallback
    }
  }

  const renderTypeBadge = (type?: string) => {
    const upperType = type?.toUpperCase();
    if (upperType === 'SPOT') {
      return (
        <span className="bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[9px] uppercase font-medium text-rose-400">
          📍 景點手帳
        </span>
      );
    }
    if (upperType === 'DISH') {
      return (
        <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] uppercase font-medium text-emerald-400">
          🍳 私房料理
        </span>
      );
    }
    return (
      <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-[9px] uppercase font-medium text-zinc-300">
        📝 秘境清單
      </span>
    );
  };

  const renderIcon = (type?: string) => {
    const upperType = type?.toUpperCase();
    if (upperType === 'SPOT') {
      return (
        <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
          <MapPin size={16} />
        </div>
      );
    }
    if (upperType === 'DISH') {
      return (
        <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <Utensils size={16} />
        </div>
      );
    }
    return (
      <div className="p-1.5 bg-zinc-800 text-zinc-400 rounded-lg">
        <List size={16} />
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 p-6 pb-24">
      {/* App Header */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen size={24} className="text-amber-400" />
            SecretSpace
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Hello, {user.email?.split('@')[0]}</p>
        </div>

        <Link
          href="/create"
          className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-md"
        >
          <Plus size={16} />
          寫筆記
        </Link>
      </div>

      {/* Keyword Search Input Bar */}
      <form action="/" method="GET" className="mb-4">
        <input type="hidden" name="tab" value={currentTab} />
        {selectedFriendId && <input type="hidden" name="friendId" value={selectedFriendId} />}
        <div className="relative">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="🔍 搜尋標題、美食、地址關鍵字..."
            className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner"
          />
          <Search size={15} className="absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
        </div>
      </form>

      {params?.success === '1' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl mb-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
          🎉 解鎖成功！已自動收錄朋友的全量私房筆記庫。
        </div>
      )}

      {params?.deleted === '1' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
          🗑️ 筆記已成功刪除。
        </div>
      )}

      {params?.message && (
        <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs p-3 rounded-xl mb-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
          {params.message}
        </div>
      )}

      {/* Main Tabs (3 Tabs: 我的筆記 | 朋友私房 | 願望清單) */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/80 mb-4">
        <Link
          href="/?tab=my"
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'my'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen size={14} className={currentTab === 'my' ? 'text-amber-400' : ''} />
          我的 ({currentTab === 'my' ? myContents.length : '•'})
        </Link>

        <Link
          href="/?tab=friends"
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'friends'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users size={14} className={currentTab === 'friends' ? 'text-rose-400' : ''} />
          朋友 ({currentTab === 'friends' ? friendsContents.length : '•'})
        </Link>

        <Link
          href="/?tab=bookmarks"
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'bookmarks'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Heart size={14} className={currentTab === 'bookmarks' ? 'text-rose-500 fill-rose-500' : ''} />
          願望清單 ({currentTab === 'bookmarks' ? bookmarkedContents.length : '•'})
        </Link>
      </div>

      {/* Friends Filter Bar (Only in Friends Tab) */}
      {currentTab === 'friends' && friendProfiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <Link
            href="/?tab=friends"
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
              !selectedFriendId
                ? 'bg-amber-400 text-black border-amber-300 shadow-md font-bold'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Users size={12} />
            全部朋友
          </Link>

          {friendProfiles.map((friend) => {
            const isSelected = selectedFriendId === friend.id;
            return (
              <Link
                key={friend.id}
                href={`/?tab=friends&friendId=${friend.id}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <User size={12} />
                {friend.username}
              </Link>
            );
          })}
        </div>
      )}

      {/* Content List: My Notes */}
      {currentTab === 'my' && (
        <div className="flex flex-col gap-4">
          {myContents.length > 0 ? (
            myContents.map((content) => (
              <Link key={content.id} href={`/content/${content.id}`}>
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 hover:border-zinc-700 transition-all cursor-pointer relative shadow-lg group overflow-hidden">
                  <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                  </div>

                  <div
                    className={`absolute top-0 right-6 w-3 h-5 rounded-b-sm shadow-md ${
                      content.type?.toUpperCase() === 'SPOT' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />

                  <div className="pl-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {renderIcon(content.type)}
                        <h3 className="font-bold text-zinc-100 group-hover:text-amber-300 transition-colors text-base pr-4 flex items-center gap-1.5">
                          {content.title}
                          {content.is_private && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-normal">
                              <Lock size={10} />
                              極密
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    {content.address && (
                      <p className="text-xs text-zinc-400 line-clamp-1 mb-2 flex items-center gap-1">
                        <Compass size={12} className="text-rose-400 shrink-0" />
                        {content.address}
                      </p>
                    )}

                    <div className="text-[10px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-2">
                      <span>{new Date(content.created_at).toLocaleDateString()}</span>
                      {renderTypeBadge(content.type)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800/80 rounded-3xl bg-zinc-900/30">
              <div className="bg-amber-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 border border-amber-500/20">
                <BookOpen size={22} />
              </div>
              <h3 className="text-zinc-200 font-bold mb-1">
                {searchQuery ? '未找到符合搜尋的私房筆記' : '您的私房手帳還是空的'}
              </h3>
              <p className="text-zinc-500 text-xs mb-5">點擊下方按鈕，記錄您的第一個秘境景點或私房料理</p>
              <Link
                href="/create"
                className="text-xs font-semibold bg-amber-400 text-black px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-colors shadow-lg"
              >
                新建第一個筆記
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Content List: Friends' Notes */}
      {currentTab === 'friends' && (
        <div className="flex flex-col gap-4">
          {friendsContents.length > 0 ? (
            friendsContents.map((content) => {
              const authorName = content.users?.username || '朋友';
              return (
                <Link key={content.id} href={`/content/${content.id}`}>
                  <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all cursor-pointer relative shadow-lg group overflow-hidden">
                    <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                    </div>

                    <div
                      className={`absolute top-0 right-6 w-3 h-5 rounded-b-sm shadow-md ${
                        content.type?.toUpperCase() === 'SPOT' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />

                    <div className="pl-4">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          來自 {authorName} 的私房筆記
                        </span>
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {renderIcon(content.type)}
                          <h3 className="font-bold text-zinc-100 group-hover:text-amber-300 transition-colors text-base pr-4">
                            {content.title}
                          </h3>
                        </div>
                      </div>

                      {content.address && (
                        <p className="text-xs text-zinc-400 line-clamp-1 mb-2 flex items-center gap-1">
                          <Compass size={12} className="text-rose-400 shrink-0" />
                          {content.address}
                        </p>
                      )}

                      <div className="text-[10px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-2">
                        <span>{new Date(content.created_at).toLocaleDateString()}</span>
                        {renderTypeBadge(content.type)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800/80 rounded-3xl bg-zinc-900/30">
              <div className="bg-rose-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-rose-400 border border-rose-500/20">
                <Users size={22} />
              </div>
              <h3 className="text-zinc-200 font-bold mb-1">
                {selectedFriendId ? '該好友尚未發布公開筆記' : '尚未收錄朋友的私房筆記'}
              </h3>
              <p className="text-zinc-500 text-xs mb-5">
                {selectedFriendId ? '點擊「全部朋友」切換檢視其他人，或提醒對方新增筆記！' : '點擊底部「掃描」功能，掃描朋友的個人手帳 QR Code 即可一次匯入！'}
              </p>
              <Link
                href="/scan"
                className="text-xs font-semibold bg-rose-500 text-white px-5 py-2.5 rounded-xl hover:bg-rose-600 transition-colors shadow-lg"
              >
                前往掃描朋友的 QR Code
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Content List: Bookmarked Wishlist Notes */}
      {currentTab === 'bookmarks' && (
        <div className="flex flex-col gap-4">
          {bookmarkedContents.length > 0 ? (
            bookmarkedContents.map((content) => {
              const authorName = content.users?.username || '私房友';
              return (
                <Link key={content.id} href={`/content/${content.id}`}>
                  <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/90 border border-rose-500/20 rounded-2xl p-5 hover:border-rose-500/40 transition-all cursor-pointer relative shadow-lg group overflow-hidden">
                    <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 border border-zinc-800" />
                    </div>

                    <div
                      className={`absolute top-0 right-6 w-3 h-5 rounded-b-sm shadow-md ${
                        content.type?.toUpperCase() === 'SPOT' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />

                    <div className="pl-4">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md">
                          ❤️ 願望清單 (來自 {authorName})
                        </span>
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {renderIcon(content.type)}
                          <h3 className="font-bold text-zinc-100 group-hover:text-rose-300 transition-colors text-base pr-4">
                            {content.title}
                          </h3>
                        </div>
                      </div>

                      {content.address && (
                        <p className="text-xs text-zinc-400 line-clamp-1 mb-2 flex items-center gap-1">
                          <Compass size={12} className="text-rose-400 shrink-0" />
                          {content.address}
                        </p>
                      )}

                      <div className="text-[10px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 mt-2">
                        <span>{new Date(content.created_at).toLocaleDateString()}</span>
                        {renderTypeBadge(content.type)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800/80 rounded-3xl bg-zinc-900/30">
              <div className="bg-rose-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-rose-400 border border-rose-500/20">
                <Heart size={22} className="fill-rose-500 text-rose-500" />
              </div>
              <h3 className="text-zinc-200 font-bold mb-1">您的願望清單還是空的</h3>
              <p className="text-zinc-500 text-xs mb-5">在瀏覽自己或朋友的私房手帳時，點擊右上方「❤️ 收錄至願望清單」即可在此快速檢視！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
