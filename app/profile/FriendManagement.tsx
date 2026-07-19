'use client';

import { useState } from 'react';
import { Users, UserX, ShieldAlert, Loader2 } from 'lucide-react';
import { revokeUserGrant } from './actions';

interface GrantItem {
  id: string;
  owner_user_id: string;
  grantee_user_id: string;
  friendName: string;
  type: 'granted_to_friend' | 'granted_by_friend';
}

export default function FriendManagement({ grants }: { grants: GrantItem[] }) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (grantId: string) => {
    setRevokingId(grantId);
    await revokeUserGrant(grantId);
  };

  if (!grants || grants.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 mb-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500 mb-2">
          <Users size={20} />
        </div>
        <h4 className="text-xs font-bold text-zinc-300">尚未建立任何手帳好友連通</h4>
        <p className="text-[11px] text-zinc-500 mt-1">出示或掃描對方的個人手帳 QR Code 即可建立好友連通關係。</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4 text-zinc-200 font-bold text-sm border-b border-zinc-800/80 pb-3">
        <ShieldAlert size={18} className="text-rose-400" />
        <span>已連通好友與私房權限管理 ({grants.length})</span>
      </div>

      <div className="flex flex-col gap-3">
        {grants.map((grant) => (
          <div
            key={grant.id}
            className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 p-3 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                {grant.friendName.substring(0, 1)}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{grant.friendName}</p>
                <span className="text-[10px] text-zinc-500">
                  {grant.type === 'granted_to_friend' ? '對方可查看您的筆記' : '您已收錄對方的筆記'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRevoke(grant.id)}
              disabled={revokingId === grant.id}
              className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-3 py-1.5 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              {revokingId === grant.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UserX size={13} />
              )}
              {revokingId === grant.id ? '撤銷中...' : '撤銷連通'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
