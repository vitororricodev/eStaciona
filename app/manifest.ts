import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'eStaciona',
    short_name: 'eStaciona',
    description: 'O controle do seu pátio na palma da mão.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FBFF',
    theme_color: '#1677F8',
    icons: [
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
