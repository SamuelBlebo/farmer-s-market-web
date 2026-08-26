'use client';

import { trackClient } from '@/lib/analytics-client';

export function WhatsAppButton({
  href,
  label = 'Contact farmer on WhatsApp',
  className = '',
  trackEntityId,
}: {
  href: string;
  label?: string;
  className?: string;
  /** Product or farmer id this click is about — omit to skip tracking. */
  trackEntityId?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackEntityId ? () => trackClient('WHATSAPP_CLICKED', trackEntityId) : undefined}
      className={`btn-wa ${className}`}
    >
      💬 {label}
    </a>
  );
}
