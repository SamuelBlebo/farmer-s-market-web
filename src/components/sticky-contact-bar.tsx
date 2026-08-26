'use client';

import { useEffect, useRef, useState } from 'react';
import { SaveButton } from './save-button';

/**
 * Renders a scroll-position sentinel where it's placed (right after the
 * gallery/hero) and a fixed bottom bar, mobile-only, that slides in once the
 * sentinel scrolls out of view. Only mounted by the caller for authenticated
 * users on an ACTIVE listing — same contact-gating rule as the main panel.
 */
export function StickyContactBar({
  whatsappHref,
  telHref,
  productId,
}: {
  whatsappHref: string;
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
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out sm:hidden ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex gap-2">
          {telHref && (
            <a href={telHref} className="btn-ghost flex-1 !py-2.5 text-center">
              📞 Call
            </a>
          )}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-wa flex-1 !py-2.5 text-center">
            💬 WhatsApp
          </a>
          <SaveButton productId={productId} compact className="flex-1 w-full !py-2.5" />
        </div>
      </div>
    </>
  );
}
