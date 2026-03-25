/// Display-only: convert stored 24h `"HH:MM"` strings to 12h with AM/PM.

/** `"HH:MM"` → `"h:MM AM|PM"` (hour 1–12, no leading zero on hour). */
export function formatTime12h(time24: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time24.trim());
  if (!match) return time24;
  const h = parseInt(match[1], 10);
  const minutes = match[2];
  if (Number.isNaN(h) || h < 0 || h > 23) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${minutes} ${period}`;
}

type TimedEventLike = {
  isAllDay: boolean;
  startTime: string | null;
  endTime: string | null;
};

/** e.g. `9:00 AM – 10:00 AM`, or `All day`. */
export function formatEventTimeDisplay(ev: TimedEventLike): string {
  if (ev.isAllDay) return 'All day';
  const start = ev.startTime ? formatTime12h(ev.startTime) : '';
  const end = ev.endTime ? formatTime12h(ev.endTime) : '';
  return `${start}${end ? ` – ${end}` : ''}`;
}
