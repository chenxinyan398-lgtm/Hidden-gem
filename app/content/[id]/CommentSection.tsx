'use client';

import { useState } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { addComment } from './actions';

interface CommentItem {
  id: string;
  comment_text: string;
  created_at: string;
  users?: {
    username?: string | null;
  } | null;
}

export default function CommentSection({
  contentId,
  comments,
}: {
  contentId: string;
  comments: CommentItem[];
}) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await addComment(contentId, formData);
    setText('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-xl mb-6">
      <div className="flex items-center gap-2 mb-4 text-zinc-200 font-bold text-sm border-b border-zinc-800/80 pb-3">
        <MessageCircle size={18} className="text-amber-400" />
        <span>手帳留言與社交迴響 ({comments.length})</span>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-5">
        <input
          type="text"
          name="comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="給這篇手帳留下迴響或詢問細節..."
          className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="bg-amber-400 text-zinc-950 p-2.5 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>

      {/* Comment List */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-zinc-950/60 border border-zinc-800/60 p-3 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <User size={12} />
                  {comment.users?.username || '熱心朋友'}
                </span>
                <span className="text-[9px] text-zinc-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed pl-1">
                {comment.comment_text}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 text-center py-4">
          尚無留言，成為第一個留下迴響的朋友吧！
        </p>
      )}
    </div>
  );
}
