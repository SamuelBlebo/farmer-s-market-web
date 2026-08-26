'use client';

import { useState } from 'react';

/**
 * Banner-shaped sibling of AvatarUploader — same unsigned Cloudinary upload
 * flow, just a landscape preview instead of a circular one.
 */
export function CoverImageUploader({ initialUrl, name }: { initialUrl?: string | null; name: string }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file || !cloud || !preset) return;
    setBusy(true);
    setError(null);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUrl(data.secure_url);
    } catch {
      setError('That photo did not upload. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-muted">No cover photo yet</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          upload(e.target.files);
          e.target.value = '';
        }}
        className="mt-2 block text-sm"
      />
      {busy && <p className="mt-1 text-xs text-muted">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
