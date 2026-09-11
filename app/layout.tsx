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
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
