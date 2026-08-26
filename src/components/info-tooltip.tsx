/** CSS-only hover/focus reveal — no JS needed. `title` gives a native fallback for touch/screen readers. */
export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex" tabIndex={0}>
      <span
        className="grid h-4 w-4 shrink-0 cursor-help place-items-center rounded-full bg-paper text-[10px] font-bold text-muted"
        title={text}
        aria-hidden
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
