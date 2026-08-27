'use client';

import { PhoneIcon } from './icons';
import { trackClient } from '@/lib/analytics-client';

export function TrackedCallLink({ href, productId, className = '' }: { href: string; productId: string; className?: string }) {
  return (
    <a href={href} onClick={() => trackClient('CALL_CLICKED', productId)} className={className}>
      <PhoneIcon className="h-4 w-4" /> Call farmer
    </a>
  );
}
