import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/nav';
import { TopProgressBar } from '@/components/top-progress-bar';
import { ToastProvider } from '@/components/toast-provider';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Farmers Market — buy and sell produce in Ghana',
  description:
    'Farmers list what they have. Buyers find it and message them on WhatsApp. No middlemen, no fees.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D4E37' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <ToastProvider>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <div className="mx-auto max-w-[1120px] px-4 py-5 pb-16">
            <Nav />
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
