import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { signOut, updateProfile } from './actions';
import { User, LogOut, BookOpen, Mail } from 'lucide-react';
import UserQrModal from './UserQrModal';
import FriendManagement from './FriendManagement';
import SeedDataButton from './SeedDataButton';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const username = profile?.username || user.email?.split('@')[0] || '無名旅人';

  // Fetch all user grants involved with this user
  const { data: grants } = await supabase
    .from('user_grants')
    .select('*')
    .or(`owner_user_id.eq.${user.id},grantee_user_id.eq.${user.id}`);

  // Fetch friend user profiles
  const friendUserIds = Array.from(
    new Set(
      (grants || []).map((g) => (g.owner_user_id === user.id ? g.grantee_user_id : g.owner_user_id))
    )
  );

  let userProfilesMap: Record<string, string> = {};
  if (friendUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users')
      .select('id, username')
      .in('id', friendUserIds);

    profiles?.forEach((p) => {
      userProfilesMap[p.id] = p.username || '無名旅人';
    });
  }

  const formattedGrants = (grants || []).map((g) => {
    const isOwner = g.owner_user_id === user.id;
    const friendId = isOwner ? g.grantee_user_id : g.owner_user_id;
    return {
      id: g.id,
      owner_user_id: g.owner_user_id,
      grantee_user_id: g.grantee_user_id,
      friendName: userProfilesMap[friendId] || '匿名好友',
      type: isOwner ? ('granted_to_friend' as const) : ('granted_by_friend' as const),
    };
  });

  return (
    <div className="flex flex-col flex-1 p-6 pb-24">
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">個人手帳中心</h1>
        <p className="text-sm text-zinc-400 mt-1">管理您的專屬帳號與私房筆記授權</p>
      </div>

      {params?.error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
          {params.error}
        </div>
      )}

      {params?.message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl mb-4 text-center">
          {params.message}
        </div>
      )}

      {/* Seed Demo Data Button */}
      <SeedDataButton />

      {/* User Info Card with Leather Notebook Aesthetics */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-400 border border-zinc-700 shadow-inner">
            <User size={32} />
          </div>
          <div>
            <h2 className="font-bold text-zinc-100 text-lg flex items-center gap-2">
              {username}
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-normal">
                手帳主人
              </span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
              <Mail size={14} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* User QR Code Section */}
        <div className="mb-6">
          <UserQrModal userId={user.id} username={username} />
        </div>

        <form action={updateProfile} className="flex flex-col gap-4 border-t border-zinc-800/80 pt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-xs font-medium text-zinc-400 pl-1">
              修改手帳署名 / 暱稱
            </label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={profile?.username || ''}
              placeholder="輸入您的手帳暱稱"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-zinc-100 text-zinc-950 font-semibold py-2.5 rounded-xl text-sm hover:bg-white transition-colors"
          >
            儲存變更
          </button>
        </form>
      </div>

      {/* Friend Access Grants List */}
      <FriendManagement grants={formattedGrants} />

      {/* Security Status */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl mt-0.5">
          <BookOpen size={18} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-300 mb-0.5">私房筆記隱私機制</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            未出示 QR Code 授權時，您的所有私房筆記均處於加密封閉狀態。只有經您 QR Code 掃描授權的朋友才能閱覽。
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <form action={signOut} className="mt-auto">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold py-3 rounded-xl hover:bg-red-500/20 transition-colors text-sm"
        >
          <LogOut size={18} />
          登出帳號
        </button>
      </form>
    </div>
  );
}
