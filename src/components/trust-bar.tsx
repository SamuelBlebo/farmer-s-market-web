type Item = { icon: React.ReactNode; label: string; sublabel?: string; tone?: 'leaf' | 'muted' };

/** Persistent trust strip under the header for farmers/buyers — verification, location, tenure, activity. */
export function TrustBar({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-wrap items-start gap-x-7 gap-y-3 rounded-card border border-line bg-paper px-4 py-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.tone === 'leaf' ? 'bg-leaf-light text-leaf-dark' : 'bg-white text-muted'}`}>
            {item.icon}
          </span>
          <span className="leading-tight">
            <span className={`block text-[13px] font-bold ${item.tone === 'leaf' ? 'text-leaf-dark' : 'text-ink'}`}>{item.label}</span>
            {item.sublabel && <span className="block text-[11.5px] text-muted">{item.sublabel}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
