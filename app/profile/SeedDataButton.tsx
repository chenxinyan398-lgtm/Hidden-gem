'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { seedTestData } from './actions';

export default function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    await seedTestData();
  };

  return (
    <button
      onClick={handleSeed}
      disabled={isSeeding}
      className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/30 text-purple-300 font-semibold py-3.5 rounded-2xl transition-all shadow-lg mb-6 disabled:opacity-50"
    >
      {isSeeding ? (
        <Loader2 size={18} className="animate-spin text-purple-400" />
      ) : (
        <Sparkles size={18} className="text-purple-400" />
      )}
      {isSeeding ? '正在產生實測資料...' : '🧪 一鍵匯入實測展示資料 (景點+料理)'}
    </button>
  );
}
