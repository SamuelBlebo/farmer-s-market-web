'use client';

import { ChatButton } from './chat-button';
import { PhoneIcon } from './icons';
import { SaveButton } from './save-button';
import { trackClient } from '@/lib/analytics-client';

/**
 * A permanently fixed bottom bar, mobile-only, so Call/Chat/Save are always
 * one tap away while browsing a listing. Only mounted by the caller for
 * authenticated users on an ACTIVE listing — same contact-gating rule as
 * the main panel.
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
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:hidden">
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
  );
}
