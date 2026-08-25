import Link from 'next/link';

/** Shown instead of WhatsApp/call actions when the viewer isn't signed in. */
export function ContactPrompt({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`rounded-[10px] bg-paper p-3 text-center ${className}`}>
      <p className="text-sm font-semibold text-muted">{message}</p>
      <Link href="/login" className="btn mt-2 w-full">Sign in</Link>
    </div>
  );
}
