/// Cross-browser time control (12-hour clock + AM/PM). Outward value is always "HH:MM" 24h.

import './TimePicker.css';

/** Display/value in select: always two digits (01–12) so the closed field never shows a single digit. */
const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

function hourToSelectValue(h12: string): string {
  const n = parseInt(h12, 10);
  if (Number.isNaN(n) || n < 1 || n > 12) return '12';
  return String(n).padStart(2, '0');
}
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseTimeValue(value: string): { h24: number; minute: string } {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return { h24: 9, minute: '00' };
  let h = parseInt(match[1], 10);
  let m = parseInt(match[2], 10);
  if (Number.isNaN(h) || h < 0 || h > 23) h = 9;
  if (Number.isNaN(m) || m < 0 || m > 59) m = 0;
  return {
    h24: h,
    minute: String(m).padStart(2, '0'),
  };
}

function to12HourParts(h24: number): { h12: string; period: 'AM' | 'PM' } {
  if (h24 === 0) return { h12: '12', period: 'AM' };
  if (h24 < 12) return { h12: String(h24), period: 'AM' };
  if (h24 === 12) return { h12: '12', period: 'PM' };
  return { h12: String(h24 - 12), period: 'PM' };
}

function to24Hour(h12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return h12 === 12 ? 0 : h12;
  }
  return h12 === 12 ? 12 : h12 + 12;
}

function formatHm24(h24: number, minute: string): string {
  return `${String(h24).padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

type TimePickerProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  /** Accessible name for the minute dropdown (hour uses the visible label via `id`). */
  minuteSelectAriaLabel?: string;
  periodSelectAriaLabel?: string;
};

export default function TimePicker({
  id,
  value,
  onChange,
  disabled = false,
  className = '',
  minuteSelectAriaLabel = 'Minutes',
  periodSelectAriaLabel = 'AM or PM',
}: TimePickerProps) {
  const { h24, minute } = parseTimeValue(value);
  const { h12, period } = to12HourParts(h24);

  const commit = (nextH12: string, nextMinute: string, nextPeriod: 'AM' | 'PM') => {
    const num = parseInt(nextH12, 10);
    const safe = Number.isNaN(num) || num < 1 || num > 12 ? 12 : num;
    onChange(formatHm24(to24Hour(safe, nextPeriod), nextMinute.padStart(2, '0')));
  };

  return (
    <div className={`time-picker ${className}`.trim()}>
      <select
        id={id}
        className="time-picker-select time-picker-select--hour"
        value={hourToSelectValue(h12)}
        disabled={disabled}
        onChange={(e) => commit(e.target.value, minute, period)}
      >
        {HOURS_12.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="time-picker-separator" aria-hidden>
        :
      </span>
      <select
        id={`${id}-minute`}
        className="time-picker-select time-picker-select--minute"
        value={minute}
        disabled={disabled}
        onChange={(e) => commit(h12, e.target.value, period)}
        aria-label={minuteSelectAriaLabel}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        id={`${id}-period`}
        className="time-picker-select time-picker-select--period"
        value={period}
        disabled={disabled}
        onChange={(e) =>
          commit(h12, minute, e.target.value === 'PM' ? 'PM' : 'AM')
        }
        aria-label={periodSelectAriaLabel}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
