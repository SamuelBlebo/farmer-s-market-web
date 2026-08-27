'use client';

import { useState } from 'react';
import { CameraIcon } from './icons';

type Uploaded = { url: string; publicId: string };

const MAX_DIMENSION = 1600;
const COMPRESS_ABOVE_BYTES = 700_000;
const JPEG_QUALITY = 0.82;

/**
 * Downscales large photos to a max 1600px edge and re-encodes as JPEG before
 * upload — matters on Ghanaian mobile data. Small files pass through untouched.
 */
async function prepareFile(file: File): Promise<File | Blob> {
  if (file.size <= COMPRESS_ABOVE_BYTES || !file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  return blob && blob.size < file.size ? blob : file;
}

/**
 * Unsigned Cloudinary upload straight from the browser — the image never passes
 * through our server, which matters on Ghanaian mobile data.
 */
export function ImageUploader({ max = 5, initial = [] }: { max?: number; initial?: Uploaded[] }) {
  const [images, setImages] = useState<Uploaded[]>(initial);
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
        const prepared = await prepareFile(file);
        const body = new FormData();
        body.append('file', prepared, file.name);
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

  function remove(publicId: string) {
    setImages((prev) => prev.filter((img) => img.publicId !== publicId));
  }

  return (
    <div>
      {images.map((img) => (
        <input key={img.publicId} type="hidden" name="images" value={JSON.stringify(img)} />
      ))}

      <div className="rounded-[10px] border-[1.5px] border-dashed border-line bg-[#FAFCFA] p-5 text-center">
        <CameraIcon className="mx-auto h-8 w-8 text-muted" />
        <div className="mt-1 font-semibold">Add up to {max} photos</div>
        <p className="text-[12.5px] text-muted">Listings with photos get contacted far more often</p>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy || images.length >= max}
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = '';
          }}
          className="mx-auto mt-3 block text-sm"
        />
        {busy && <p className="mt-2 text-sm text-muted">Uploading…</p>}
        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
      </div>

      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.publicId} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-14 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => remove(img.publicId)}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
