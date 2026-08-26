import type { MetadataRoute } from 'next';
import { PLATFORM_NAME } from '@/lib/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PLATFORM_NAME} — buy and sell produce in Ghana`,
    short_name: PLATFORM_NAME,
    description: 'Farmers list what they have. Buyers find it and message them on WhatsApp. No middlemen, no fees.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2F5F1',
    theme_color: '#0D4E37',
    // A single scalable SVG rather than generated PNGs — this app has no
    // existing raster brand asset, and hand-authoring one SVG matches how
    // every other icon in this codebase (public/seed/*, components/icons.tsx)
    // is made. Chromium-based browsers (the dominant install-prompt path on
    // Android/desktop) accept SVG manifest icons; iOS's install-icon picker
    // does not read the manifest at all and falls back to a page screenshot
    // regardless, so this doesn't cost anything there either.
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
