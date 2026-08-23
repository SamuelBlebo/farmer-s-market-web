'use client';

export function WhatsAppButton({
  href,
  label = 'Contact farmer on WhatsApp',
  className = '',
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`btn-wa ${className}`}>
      💬 {label}
    </a>
  );
}
