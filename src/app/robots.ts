import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing behind a role gate belongs in a search index, and the JSON
      // API endpoints aren't pages — no point spending crawl budget on either.
      disallow: ['/admin', '/account', '/dashboard', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
