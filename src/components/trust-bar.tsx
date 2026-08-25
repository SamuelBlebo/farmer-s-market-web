type Item = { icon: React.ReactNode; label: string; tone?: 'leaf' | 'muted' };

/** Persistent trust strip under the header for farmers/buyers — verification, location, tenure, activity. */
export function TrustBar({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-line bg-paper px-4 py-2.5 text-[13px]">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center gap-1.5 font-semibold ${item.tone === 'leaf' ? 'text-leaf-dark' : 'text-muted'}`}>
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}
