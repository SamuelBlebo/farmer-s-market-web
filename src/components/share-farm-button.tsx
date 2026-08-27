'use client';

import { useState } from 'react';
import { CheckIcon, LinkIcon } from './icons';
import { useToast } from './toast-provider';

/**
 * Web Share API when the browser supports it (tries to include the cover
 * photo as a shared file, falling back to text-only share if that fails or
 * isn't supported), otherwise copies the storefront link to the clipboard.
 * Only ever shares this public page's own URL/content — no private data.
 */
export function ShareFarmButton({
  farmName,
  region,
  trustScore,
  coverImage,
  className = '',
}: {
  farmName: string;
  region: string;
  trustScore: number;
  coverImage?: string | null;
  className?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = `${farmName} — ${region} · ${trustScore}/100 Trust Score on Farmers Market`;
    const shareData: ShareData = { title: farmName, text, url };

    if (typeof navigator !== 'undefined' && navigator.share) {
      if (coverImage && navigator.canShare) {
        try {
          const res = await fetch(coverImage);
          const blob = await res.blob();
          const file = new File([blob], 'farm-cover.jpg', { type: blob.type || 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ ...shareData, files: [file] });
            return;
          }
        } catch {
          // Fall through to a plain text/link share below.
        }
      }
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled, or share failed — fall back to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link — try again.');
    }
  }

  return (
    <button id="share-farm" type="button" onClick={share} className={`btn-ghost ${className}`}>
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4" /> Copied
        </>
      ) : (
        <>
          <LinkIcon className="h-4 w-4" /> Share Farm
        </>
      )}
    </button>
  );
}
