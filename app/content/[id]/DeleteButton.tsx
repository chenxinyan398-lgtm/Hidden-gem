'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { deleteContent } from './actions';

export default function DeleteButton({ contentId, title }: { contentId: string; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteContent(contentId);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl transition-colors text-xs font-semibold mt-6"
      >
        <Trash2 size={15} />
        刪除這筆私房筆記
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

            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-2 mt-2">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-lg font-bold text-white mb-1">確定要刪除此筆記？</h2>
            <p className="text-zinc-400 text-xs text-center mb-6 px-2">
              將刪除「<span className="text-zinc-200 font-semibold">{title}</span>」。刪除後無法復原。
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-zinc-800 text-zinc-300 font-medium py-2.5 rounded-xl hover:bg-zinc-700 transition-colors text-xs"
              >
                取消
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-xs shadow-lg shadow-red-950/50 disabled:opacity-50"
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
