'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Link2, AlertCircle, ClipboardPaste } from 'lucide-react';

interface ImportedData {
  title: string;
  type: 'spot' | 'dish';
  address: string;
  recommendation: string;
  content: string;
  recommended_dishes?: string;
  price_range?: string;
  dining_review?: string;
  photos: string[];
}

interface IgImportSectionProps {
  initialUrl?: string;
  onImportSuccess: (data: ImportedData) => void;
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function IgImportSection({ initialUrl = '', onImportSuccess }: IgImportSectionProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepMessage, setStepMessage] = useState('');
  const [showInput, setShowInput] = useState(Boolean(initialUrl));
  
  const hasAutoTriggered = useRef(false);

  const handleImport = async (targetUrl?: string) => {
    const importUrl = targetUrl || url;
    if (!importUrl.trim()) {
      setError('請輸入 IG 貼文連結');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStepMessage('📸 正在讀取受分享的 Instagram 圖文內容...');

    try {
      const stepTimer = setTimeout(() => {
        setStepMessage('🧠 正在呼叫 Gemini AI 進行視覺與地點分析...');
      }, 3000);

      const res = await fetch('/api/import/ig-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() })
      });

      clearTimeout(stepTimer);

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || '自動解析貼文失敗');
      }

      setStepMessage('✨ 解析完成！已自動填入手帳表單');

      setTimeout(() => {
        setIsLoading(false);
        setShowInput(false);
        setUrl('');
        onImportSuccess(json.data);
      }, 600);

    } catch (err: any) {
      console.error('Import Error:', err);
      setError(err.message || '連線逾時或抓取失敗');
      setIsLoading(false);
    }
  };

  // 自動讀取剪貼簿功能的特快按鈕
  const handleReadClipboard = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('您的瀏覽器不支援自動讀取剪貼簿，請手動貼上連結');
      }
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.includes('instagram.com')) {
        setUrl(clipText);
        setShowInput(true);
        handleImport(clipText);
      } else if (clipText && clipText.startsWith('http')) {
        setUrl(clipText);
        setShowInput(true);
        handleImport(clipText);
      } else {
        setError('剪貼簿中未發現 IG 連結，請先在 IG 點擊「複製連結」');
        setShowInput(true);
      }
    } catch (err: any) {
      setError('無法讀取剪貼簿，請點擊「貼上連結」手動貼上');
      setShowInput(true);
    }
  };

  // 當使用者透過手機系統選單「分享至本 App」開啟頁面時，自動觸發 AI 解析！
  useEffect(() => {
    if (initialUrl && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      setShowInput(true);
      setUrl(initialUrl);
      handleImport(initialUrl);
    }
  }, [initialUrl]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-rose-950/30 to-zinc-900/90 border border-purple-500/30 p-4 shadow-xl transition-all">
      {/* Glow background accent */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md">
            <InstagramIcon size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>IG 貼文智慧匯入</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                AI 2.0
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">複製 IG 連結後即可快速生成筆記</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 一鍵讀取剪貼簿快捷鈕 */}
          <button
            type="button"
            onClick={handleReadClipboard}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/30 transition-all active:scale-95 flex items-center gap-1"
            title="一鍵讀取剪貼簿連結"
          >
            <ClipboardPaste size={13} />
            <span>一鍵貼上</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInput(!showInput)}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 transition-all active:scale-95 flex items-center gap-1"
          >
            <Sparkles size={13} className="text-amber-300 animate-pulse" />
            {showInput ? '收起' : '手動輸入'}
          </button>
        </div>
      </div>

      {showInput && (
        <div className="mt-3.5 pt-3 border-t border-purple-500/20 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 size={15} className="absolute left-3 top-3 text-zinc-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="貼上 IG 貼文網址 (例如: https://www.instagram.com/p/...)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-950/80 border border-purple-500/30 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <button
              type="button"
              onClick={() => handleImport()}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoading ? '解析中' : 'AI 生成'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-2.5 rounded-xl animate-pulse">
              <Loader2 size={14} className="animate-spin text-purple-400 shrink-0" />
              <span>{stepMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
