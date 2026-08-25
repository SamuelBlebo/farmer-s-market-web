import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';
import { TopProgressBar } from '@/components/top-progress-bar';

export const metadata: Metadata = {
  title: 'Farmers Market — buy and sell produce in Ghana',
  description:
    'Farmers list what they have. Buyers find it and message them on WhatsApp. No middlemen, no fees.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D4E37' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <div className="mx-auto max-w-[1120px] px-4 py-5 pb-16">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
