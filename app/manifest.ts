import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Leitner',
    short_name: 'Leitner',
    description: 'Saghar yek dokhtare naz ast',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9f8f4',
    theme_color: '#f9f8f4',
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
  }
}