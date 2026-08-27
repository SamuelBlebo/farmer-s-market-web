'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatButton } from './chat-button';
import { PhoneIcon } from './icons';
import { SaveButton } from './save-button';
import { trackClient } from '@/lib/analytics-client';

/**
 * Renders a scroll-position sentinel where it's placed (right after the
 * gallery/hero) and a fixed bottom bar, mobile-only, that slides in once the
 * sentinel scrolls out of view. Only mounted by the caller for authenticated
 * users on an ACTIVE listing — same contact-gating rule as the main panel.
 */
export function StickyContactBar({
  farmerUserId,
  telHref,
  productId,
}: {
  /** Chat is buyer-only — pass null for a farmer/admin viewer and the button is simply omitted. */
  farmerUserId: string | null;
  telHref: string | null;
  productId: string;
}) {
  const [visible, setVisible] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={markerRef} aria-hidden className="h-px" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out sm:hidden ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex gap-2">
          {telHref && (
            <a href={telHref} onClick={() => trackClient('CALL_CLICKED', productId)} className="btn-ghost flex-1 justify-center !py-2.5">
              <PhoneIcon className="h-4 w-4" /> Call
            </a>
          )}
          {farmerUserId && (
            <ChatButton otherUserId={farmerUserId} productId={productId} label="Chat" className="btn flex-1 justify-center !py-2.5" />
          )}
          <SaveButton productId={productId} compact className="flex-1 w-full !py-2.5" />
        </div>
      </div>
    </>
  );
}
