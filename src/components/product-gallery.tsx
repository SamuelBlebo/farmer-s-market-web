'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProductGallery({
  images,
  name,
  emoji,
}: {
  images: { url: string }[];
  name: string;
  emoji: string | null;
}) {
  const [active, setActive] = useState(0);
  const hero = images[active]?.url;

  return (
    <div>
      <div className="relative grid h-72 place-items-center overflow-hidden rounded-card bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-8xl">
        {hero ? (
          <Image src={hero} alt={name} fill sizes="(max-width:1024px) 100vw, 640px" className="object-cover" priority />
        ) : (
          <span aria-hidden>{emoji ?? '🌿'}</span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? 'border-leaf' : 'border-transparent'
              }`}
              aria-label={`Show photo ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
