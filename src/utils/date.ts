const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

interface DateParts {
  weekday: string;
  day: number;
  month: string;
  year: number;
}

/** Splits an ISO "yyyy-MM-dd" date into Arabic parts. Uses UTC so time zones never shift the day. */
function toDateParts(isoDate: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return {
    weekday: ARABIC_WEEKDAYS[date.getUTCDay()],
    day,
    month: ARABIC_MONTHS[month - 1],
    year,
  };
}

/**
 * Certificate date line, per the spec:
 * "2026-05-03" → "وذلك يوم الأحد الموافق 3 مايو 2026" (weekday computed, English digits).
 * Falls back to the raw sheet text when the date could not be parsed.
 */
export function formatCertificateDateLine(isoDate: string | null, rawDate: string): string {
  const parts = isoDate ? toDateParts(isoDate) : null;
  if (parts) return `وذلك يوم ${parts.weekday} الموافق ${parts.day} ${parts.month} ${parts.year}`;
  return rawDate.trim() ? `وذلك بتاريخ ${rawDate.trim()}` : '';
}

/** Short date for the website's event cards, e.g. "الأربعاء، 7 أكتوبر 2026". */
export function formatDisplayDate(isoDate: string | null, rawDate: string): string {
  const parts = isoDate ? toDateParts(isoDate) : null;
  if (parts) return `${parts.weekday}، ${parts.day} ${parts.month} ${parts.year}`;
  return rawDate.trim();
}
