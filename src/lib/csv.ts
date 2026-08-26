function escapeCsvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Headers row + data rows, CRLF-joined per RFC 4180 — no library needed for a plain flat export. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}
