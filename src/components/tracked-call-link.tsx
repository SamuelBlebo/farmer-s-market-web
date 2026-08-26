'use client';

import { trackClient } from '@/lib/analytics-client';

export function TrackedCallLink({ href, productId, className = '' }: { href: string; productId: string; className?: string }) {
  return (
    <a href={href} onClick={() => trackClient('CALL_CLICKED', productId)} className={className}>
      📞 Call farmer
    </a>
  );
}
