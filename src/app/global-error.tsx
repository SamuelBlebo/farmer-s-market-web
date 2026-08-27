'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/monitoring';

/**
 * Replaces the entire root layout when the layout itself throws, so it
 * can't rely on globals.css/Tailwind having loaded — inline styles only,
 * per Next.js's own guidance for this file.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: 'global' });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#F2F5F1', color: '#12211A' }}>
        <div style={{ maxWidth: 420, margin: '96px auto', textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 32, margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 0' }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: '#5F6F63', marginTop: 8 }}>Please refresh the page.</p>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#136B4B',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {/* Plain anchor, not next/link — the router itself may be part of what's broken here. */}
            <a
              href="/support"
              style={{
                background: 'white',
                color: '#12211A',
                border: '1px solid #DDE5DC',
                borderRadius: 10,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Get help
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
