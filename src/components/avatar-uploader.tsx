'use client';

import { useState } from 'react';
import { CameraIcon } from './icons';

/**
 * Single-photo variant of ImageUploader's unsigned Cloudinary upload flow —
 * a profile photo is one image with a name/description, not a gallery.
 */
export function AvatarUploader({ initialUrl, name }: { initialUrl?: string | null; name: string }) {
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
    <div className="flex items-center gap-3">
      <input type="hidden" name={name} value={url} />
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-xl font-extrabold text-leaf-dark">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <CameraIcon className="h-6 w-6" />
        )}
      </div>
      <div>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = '';
          }}
          className="block text-sm"
        />
        {busy && <p className="mt-1 text-xs text-muted">Uploading…</p>}
        {error && <p className="mt-1 text-xs text-clay">{error}</p>}
      </div>
    </div>
  );
}
