'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Check, BookOpen } from 'lucide-react';

export default function UserQrModal({ userId, username }: { userId: string; username: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/scan?userId=${userId}`);
    }
  }, [userId]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/30 text-amber-200 font-semibold py-3.5 rounded-2xl transition-all shadow-lg"
      >
        <QrCode size={20} className="text-amber-400" />
        出示我的私房手帳 QR Code
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 flex flex-col items-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 mt-2">
              <BookOpen size={24} />
            </div>

            <h2 className="text-xl font-bold text-white mb-1">【{username}】的私房手帳</h2>
            <p className="text-zinc-400 text-xs text-center mb-6 px-2">出示此 QR Code 供朋友掃描，即可一次完整授權對方閱覽您所有的景點與私房筆記。</p>

            <div className="bg-white p-4 rounded-2xl mb-6 shadow-2xl border-4 border-amber-500/20">
              {shareUrl ? (
                <QRCodeSVG
                  value={shareUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-400 text-sm">
                  產生中...
                </div>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium py-2.5 rounded-xl hover:bg-zinc-700 transition-colors text-sm mb-3"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? '已複製專屬授權網址！' : '複製個人手帳解鎖連結'}
            </button>

            <p className="text-[11px] text-zinc-500 text-center">掃描或訪問連結後，朋友的 App 將自動新增您的私房筆記庫。</p>
          </div>
        </div>
      )}
    </>
  );
}
