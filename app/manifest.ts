import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SecretSpace 私房手帳',
    short_name: '私房手帳',
    description: '你的專屬私房筆記與隨身手帳分享',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#09090b',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    // PWA Web Share Target 整合：讓手機系統「分享到...」選單出現本 App
    share_target: {
      action: '/create',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  };
}
