type DayPoint = { date: string; views: number; contacts: number; searches: number };

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = 24;

const SERIES: { key: keyof Omit<DayPoint, 'date'>; label: string; color: string }[] = [
  { key: 'views', label: 'Product Views', color: '#136B4B' },
  { key: 'contacts', label: 'Contacts', color: '#B4531F' },
  { key: 'searches', label: 'Searches', color: '#E4A11B' },
];

function buildPath(values: number[], max: number): string {
  const stepX = (WIDTH - PADDING * 2) / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = PADDING + i * stepX;
      const y = HEIGHT - PADDING - (max > 0 ? (v / max) * (HEIGHT - PADDING * 2) : 0);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Hand-rolled SVG line chart — no charting library, kept intentionally simple for a 7-point daily trend. */
export function ActivityChart({ data }: { data: DayPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.views, d.contacts, d.searches]));
  const dayLabels = data.map((d) => new Date(`${d.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' }));

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Daily activity over the last 7 days">
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={PADDING + f * (HEIGHT - PADDING * 2)}
            y2={PADDING + f * (HEIGHT - PADDING * 2)}
            stroke="#DDE5DC"
            strokeWidth={1}
          />
        ))}
        {SERIES.map((s) => (
          <path
            key={s.key}
            d={buildPath(data.map((d) => d[s.key]), max)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted">
        {dayLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
