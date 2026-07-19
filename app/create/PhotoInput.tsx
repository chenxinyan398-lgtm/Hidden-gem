'use client';

import { useState } from 'react';
import { ImagePlus, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function PhotoInput({ initialPhotos = [] }: { initialPhotos?: string[] }) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const supabase = createClient();

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      setPhotos((prev) => [...prev, urlInput.trim()]);
      setUrlInput('');
      setShowUrlField(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `user_uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading image:', error.message);
        alert(`上傳圖片失敗: ${error.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      newUrls.push(publicUrl);
    }

    setPhotos((prev) => [...prev, ...newUrls]);
    setIsUploading(false);
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
          <ImagePlus size={16} className="text-blue-400" />
          景點照片 (可上傳多張)
        </label>
        <button
          type="button"
          onClick={() => setShowUrlField(!showUrlField)}
          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
        >
          <LinkIcon size={12} />
          {showUrlField ? '使用本機圖片' : '網址輸入'}
        </button>
      </div>

      {showUrlField ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="請輸入圖片網址 (https://...)"
            className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-xl hover:bg-zinc-700 font-medium transition-colors"
          >
            新增
          </button>
        </div>
      ) : (
        <label className={`flex items-center justify-center w-full py-4 border border-dashed border-zinc-700/80 rounded-xl cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800/40'}`}>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            <span>{isUploading ? '圖片上傳中...' : '點擊選擇照片上傳'}</span>
          </div>
        </label>
      )}

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-1">
          {photos.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/70 text-zinc-300 rounded-full hover:bg-black hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
              <input type="hidden" name="photos" value={url} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
