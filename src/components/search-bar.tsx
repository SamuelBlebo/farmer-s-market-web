'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { REGIONS } from '@/lib/constants';

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  function submit(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    const q = String(formData.get('q') ?? '').trim();
    const region = String(formData.get('region') ?? '');
    q ? next.set('q', q) : next.delete('q');
    region ? next.set('region', region) : next.delete('region');
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  return (
    <form action={submit} className="mb-3 flex flex-col gap-2 sm:flex-row">
      <input name="q" className="input flex-1" placeholder="Search produce — tomatoes, maize, yam…" defaultValue={params.get('q') ?? ''} />
      <select name="region" className="input sm:w-52" defaultValue={params.get('region') ?? ''}>
        <option value="">All of Ghana</option>
        {REGIONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button className="btn">Search</button>
    </form>
  );
}
