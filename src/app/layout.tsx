import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { ChatWidgetProvider } from '@/components/chat-widget-provider';
import { FeedbackWidget } from '@/components/feedback-widget';
import { Footer } from '@/components/footer';
import { Nav } from '@/components/nav';
import { TopProgressBar } from '@/components/top-progress-bar';
import { ToastProvider } from '@/components/toast-provider';
import { ErrorMonitor } from '@/components/error-monitor';
import { PLATFORM_NAME, SITE_URL } from '@/lib/constants';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const DESCRIPTION = 'Farmers list what they have. Buyers find it and message them on WhatsApp. No middlemen, no fees.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PLATFORM_NAME} — buy and sell produce in Ghana`,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description: DESCRIPTION,
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  openGraph: {
    siteName: PLATFORM_NAME,
    type: 'website',
    locale: 'en_GH',
    title: `${PLATFORM_NAME} — buy and sell produce in Ghana`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_NAME} — buy and sell produce in Ghana`,
    description: DESCRIPTION,
  },
};

// viewportFit: 'cover' lets the page draw under the notch/home-indicator on
// modern iPhones so env(safe-area-inset-*) resolves to a real value instead
// of 0 — required for the safe-area padding used below and on fixed bars.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D4E37', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <ErrorMonitor />
        <ToastProvider>
          <ChatWidgetProvider>
            <Suspense fallback={null}>
              <TopProgressBar />
            </Suspense>
            <div className="mx-auto max-w-[1120px] px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
              <Nav />
              {children}
              <Footer />
            </div>
            <FeedbackWidget />
          </ChatWidgetProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
