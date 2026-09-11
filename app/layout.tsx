import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'eStaciona',
    template: '%s | eStaciona',
  },
  description: 'eStaciona — O controle do seu pátio na palma da mão.',
  applicationName: 'eStaciona',
  icons: {
    icon: '/icon-512.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1677F8',
  colorScheme: 'light dark',
};

const themeScript = `
  try {
    const saved = localStorage.getItem('estaciona-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) document.documentElement.classList.add('dark');
  } catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><PwaRegister />{children}</body>
    </html>
  );
}
