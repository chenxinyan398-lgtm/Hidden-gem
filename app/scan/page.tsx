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

  useEffect(() => {
    if (userIdFromUrl || contentIdFromUrl || tokenFromUrl) return;

    // Initialize scanner but don't start automatically
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [userIdFromUrl, contentIdFromUrl, tokenFromUrl]);

  const handleStartCamera = async () => {
    if (!scannerRef.current) return;
    
    setIsProcessing(true); // Temporarily use this for "starting" state
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setError('相機功能僅能在 HTTPS 環境使用。');
        setIsProcessing(false);
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('您的裝置不支援相機功能。');
        setIsProcessing(false);
        return;
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
          }
          
          let extractedContentId: string | null = null;
          let extractedUserId: string | null = null;
          let extractedToken: string | null = null;

          try {
            const url = new URL(decodedText);
            extractedUserId = url.searchParams.get('userId');
            extractedContentId = url.searchParams.get('contentId');
            extractedToken = url.searchParams.get('token');
          } catch {}

          if (!extractedUserId && !extractedContentId) {
            try {
              const data = JSON.parse(decodedText);
              if (data.userId) extractedUserId = data.userId;
              if (data.contentId) extractedContentId = data.contentId;
            } catch {}
          }

          if (extractedUserId) {
            setIsProcessing(true);
            await grantAccessAndRedirect(extractedUserId, true).catch(e => {
              setError(e.message || '授權失敗');
              setIsProcessing(false);
            });
          } else if (extractedToken) {
            setIsProcessing(true);
            await grantAccessAndRedirect(extractedToken, false, true).catch(e => {
              setError(e.message || '無效的條碼');
              setIsProcessing(false);
            });
          } else if (extractedContentId) {
            setIsProcessing(true);
            await grantAccessAndRedirect(extractedContentId, false).catch(e => {
              setError('授權失敗');
              setIsProcessing(false);
            });
          } else {
            setError('無效的解鎖 QR Code');
            setTimeout(() => setError(null), 3000);
          }
        },
        () => {}
      );
      setIsScanning(true);
      setIsProcessing(false);
    } catch (err) {
      console.error("Camera start error:", err);
      setError('相機啟動失敗：請點擊允許相機權限');
      setIsProcessing(false);
    }
  };

  if (isProcessing && !scannerRef.current?.isScanning && !error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">正在載入中...</h2>
        <p className="text-xs text-zinc-400">請稍候</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">掃描解鎖手帳</h1>
        <p className="text-sm text-zinc-400 mt-1">請將相機對準對方的個人私房手帳 QR Code</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-sm aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div id="reader" className="w-full h-full object-cover" />
          
          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10 p-6 text-center">
              <button 
                onClick={handleStartCamera}
                className="bg-amber-500 text-amber-950 font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-amber-400 active:scale-95 transition-all shadow-lg"
              >
                <Scan size={20} />
                點擊啟動相機
              </button>
              <p className="text-xs text-zinc-400 mt-4 font-medium">iOS 系統需要您手動點擊以授權相機權限</p>
            </div>
          )}

          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl m-4 z-20 shadow-lg pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl m-4 z-20 shadow-lg pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl m-4 z-20 shadow-lg pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-2xl m-4 z-20 shadow-lg pointer-events-none" />
        </div>

        {error && (
          <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-sm">
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20 w-full justify-center">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button 
              onClick={handleStartCamera}
              className="bg-zinc-800 text-white font-medium py-2 px-6 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all text-sm w-full"
            >
              重新嘗試啟動相機
            </button>
          </div>
        )}
        
        <p className="text-xs text-zinc-500 mt-8 text-center max-w-xs leading-relaxed">
          掃描成功後，對方的完整私房筆記庫將自動收錄於您的「朋友的私房筆記」專區中。
        </p>
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
