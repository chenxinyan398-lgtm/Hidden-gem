'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, X, Copy, Check } from 'lucide-react';

export default function ShareButton({ contentId }: { contentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen && !shareUrl) {
      import('./actions').then(({ generateShareToken }) => {
        generateShareToken(contentId).then((token) => {
          if (token) {
            setShareUrl(`${window.location.origin}/scan?token=${token}`);
          }
        });
      });
    }
  }, [contentId, isOpen, shareUrl]);

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
        className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white font-semibold py-3.5 rounded-xl hover:bg-zinc-700 transition-colors shadow-lg"
      >
        <Share2 size={18} />
        分享並產生 QR Code
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 flex flex-col items-center relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2 mt-4">解鎖 QR Code</h2>
            <p className="text-zinc-400 text-xs text-center mb-6">可使用內建相機、LINE 或應用程式內「掃描」功能開啟此網址解鎖權限。</p>
            
            <div className="bg-white p-4 rounded-2xl mb-6 shadow-xl">
              {shareUrl ? (
                <QRCodeSVG 
                  value={shareUrl} 
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-400 text-sm">
                  載入中...
                </div>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium py-2.5 rounded-xl hover:bg-zinc-700 transition-colors text-sm mb-2"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? '已複製解鎖網址！' : '複製專屬解鎖網址'}
            </button>
            
            <p className="text-[11px] text-zinc-500 text-center">掃描或進入網址後，系統將自動開啟存取權限。</p>
          </div>
        </div>
      )}
    </>
  );
}
