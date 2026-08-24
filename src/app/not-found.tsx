import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-[440px] p-10 text-center">
      <div className="text-4xl" aria-hidden>🌾</div>
      <p className="mt-2 font-bold">We couldn&apos;t find that.</p>
      <p className="mt-1 text-sm text-muted">
        The listing, farmer, or page you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/" className="btn mt-4">Back to marketplace</Link>
    </div>
  );
}
