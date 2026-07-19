'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { grantAccessAndRedirect } from './actions';

function ScanPageContent() {
  const searchParams = useSearchParams();
  const contentIdFromUrl = searchParams.get('contentId');
  const userIdFromUrl = searchParams.get('userId');
  const tokenFromUrl = searchParams.get('token');

  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Handle direct URL opening (e.g. from mobile camera or link)
  useEffect(() => {
    if (userIdFromUrl) {
      setIsProcessing(true);
      grantAccessAndRedirect(userIdFromUrl, true).catch((err) => {
        console.error(err);
        setError('手帳授權失敗，請確認已登入帳號。');
        setIsProcessing(false);
      });
    } else if (tokenFromUrl) {
      setIsProcessing(true);
      grantAccessAndRedirect(tokenFromUrl, false, true).catch((err) => {
        console.error(err);
        setError(err.message || '授權失敗，連結可能已失效。');
        setIsProcessing(false);
      });
    } else if (contentIdFromUrl) {
      setIsProcessing(true);
      grantAccessAndRedirect(contentIdFromUrl, false).catch((err) => {
        console.error(err);
        setError('授權失敗，請確認已登入帳號。');
        setIsProcessing(false);
      });
    }
  }, [userIdFromUrl, contentIdFromUrl, tokenFromUrl]);

  // Cleanup any old scanner instances on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleProcessImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Lazy initialize the scanner for file scanning
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader-hidden");
      }

      const result = await scannerRef.current.scanFile(file, true);
      if (!result) throw new Error('無法讀取 QR Code');
      
      let extractedContentId: string | null = null;
      let extractedUserId: string | null = null;
      let extractedToken: string | null = null;

      try {
        const url = new URL(result);
        extractedUserId = url.searchParams.get('userId');
        extractedContentId = url.searchParams.get('contentId');
        extractedToken = url.searchParams.get('token');
      } catch {}

      if (!extractedUserId && !extractedContentId) {
        try {
          const data = JSON.parse(result);
          if (data.userId) extractedUserId = data.userId;
          if (data.contentId) extractedContentId = data.contentId;
        } catch {}
      }

      if (extractedUserId) {
        await grantAccessAndRedirect(extractedUserId, true);
      } else if (extractedToken) {
        await grantAccessAndRedirect(extractedToken, false, true);
      } else if (extractedContentId) {
        await grantAccessAndRedirect(extractedContentId, false);
      } else {
        throw new Error('無效的解鎖 QR Code');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setError('找不到 QR Code，請確認條碼清晰且佔據畫面主體。');
      // Reset input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  if (isProcessing && !error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-bounce shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">正在為您解鎖私房手帳...</h2>
        <p className="text-xs text-zinc-400">正在解析條碼與授權，請稍候</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 pb-2 relative z-10">
        <h1 className="text-2xl font-bold text-white tracking-tight">新增私房友</h1>
        <p className="text-sm text-zinc-400 mt-1">請拍攝對方的 QR Code 來獲得筆記庫存取權</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="relative w-full max-w-sm aspect-square bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8 transition-all hover:bg-zinc-900/80">
          
          <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Scan size={40} className="text-amber-400" />
          </div>

          <h3 className="text-lg font-bold text-zinc-100 mb-2">安全條碼解鎖</h3>
          <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
            採用內建相機拍攝，100% 保證相容所有設備，無需設定複雜的隱私權限。
          </p>

          <label className="relative overflow-hidden group w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Scan size={20} className="relative z-10" />
            <span className="relative z-10 tracking-wide">開啟相機掃描</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden"
              onChange={handleProcessImage}
            />
          </label>

          {/* Hidden div required by html5-qrcode for instantiation */}
          <div id="reader-hidden" className="hidden" />

          {/* Corner markers for aesthetic */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-[2rem] m-2 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-[2rem] m-2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-[2rem] m-2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-[2rem] m-2 pointer-events-none" />
        </div>

        {error && (
          <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 w-full justify-center shadow-lg">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
        <Loader2 size={32} className="text-zinc-500 animate-spin mb-3" />
        <p className="text-sm text-zinc-400">載入中...</p>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
