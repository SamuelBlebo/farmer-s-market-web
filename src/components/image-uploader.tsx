'use client';

import { useState } from 'react';

type Uploaded = { url: string; publicId: string };

/**
 * Unsigned Cloudinary upload straight from the browser — the image never passes
 * through our server, which matters on Ghanaian mobile data.
 */
export function ImageUploader({ max = 4 }: { max?: number }) {
  const [images, setImages] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function upload(files: FileList | null) {
    if (!files?.length || !cloud || !preset) return;
    setBusy(true);
    setError(null);

    try {
      const next: Uploaded[] = [];
      for (const file of Array.from(files).slice(0, max - images.length)) {
        const body = new FormData();
        body.append('file', file);
        body.append('upload_preset', preset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        next.push({ url: data.secure_url, publicId: data.public_id });
      }
      setImages((prev) => [...prev, ...next]);
    } catch {
      setError('That photo did not upload. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {images.map((img) => (
        <input key={img.publicId} type="hidden" name="images" value={JSON.stringify(img)} />
      ))}

      <div className="rounded-[10px] border-[1.5px] border-dashed border-line bg-[#FAFCFA] p-5 text-center">
        <div className="text-3xl" aria-hidden>📷</div>
        <div className="mt-1 font-semibold">Add up to {max} photos</div>
        <p className="text-[12.5px] text-muted">Listings with photos get contacted far more often</p>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy || images.length >= max}
          onChange={(e) => upload(e.target.files)}
          className="mx-auto mt-3 block text-sm"
        />
        {busy && <p className="mt-2 text-sm text-muted">Uploading…</p>}
        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
      </div>

      {images.length > 0 && (
        <div className="mt-2 flex gap-2">
          {images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.publicId} src={img.url} alt="" className="h-14 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
