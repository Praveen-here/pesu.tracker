import type { MetadataRoute } from 'next';

// Installable web app: opens full-screen from the home screen, without the browser bar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PESU Tracker',
    short_name: 'PESU Tracker',
    description: 'Track your PESU Academy attendance and marks.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
