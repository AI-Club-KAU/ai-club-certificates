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
 * Day + month + year for a list of dates, sharing the month/year when possible:
 *   same month → "11 و12 نوفمبر 2026"; same year → "30 سبتمبر و1 أكتوبر 2026";
 *   otherwise  → "31 ديسمبر 2026 و1 يناير 2027".
 */
function joinDayMonthYear(list: DateParts[]): string {
  const sameYear = list.every((p) => p.year === list[0].year);
  const sameMonth = sameYear && list.every((p) => p.month === list[0].month);
  const last = list[list.length - 1];
  if (sameMonth) return `${list.map((p) => p.day).join(' و')} ${last.month} ${last.year}`;
  if (sameYear) return `${list.map((p) => `${p.day} ${p.month}`).join(' و')} ${last.year}`;
  return list.map((p) => `${p.day} ${p.month} ${p.year}`).join(' و');
}

/**
 * Certificate date line (weekday computed, English digits):
 *   one day      "2026-05-03"            → "وذلك يوم الأحد الموافق 3 مايو 2026"
 *   own days     ["2026-11-11","…-12"]   → "وذلك يومي الثلاثاء والأربعاء الموافق 11 و12 نوفمبر 2026"
 *                (3+ days: "وذلك أيام …")
 *   event range  date + endDate          → "وذلك خلال الفترة من 10 إلى 12 نوفمبر 2026"
 * The participant's own days win over the event range. Falls back to the raw sheet text
 * when the date could not be parsed.
 */
export function formatCertificateDateLine(
  isoDate: string | null,
  rawDate: string,
  endDate: string | null = null,
  days: string[] = [],
): string {
  const own = days.map(toDateParts).filter((p): p is DateParts => p !== null);
  if (own.length === 1) {
    const p = own[0];
    return `وذلك يوم ${p.weekday} الموافق ${p.day} ${p.month} ${p.year}`;
  }
  if (own.length > 1) {
    const word = own.length === 2 ? 'يومي' : 'أيام';
    return `وذلك ${word} ${own.map((p) => p.weekday).join(' و')} الموافق ${joinDayMonthYear(own)}`;
  }

  const start = isoDate ? toDateParts(isoDate) : null;
  const end = endDate && isoDate && endDate > isoDate ? toDateParts(endDate) : null;
  if (start && end) {
    let from = `${start.day} ${start.month} ${start.year}`;
    if (start.year === end.year) from = start.month === end.month ? `${start.day}` : `${start.day} ${start.month}`;
    return `وذلك خلال الفترة من ${from} إلى ${end.day} ${end.month} ${end.year}`;
  }
  if (start) return `وذلك يوم ${start.weekday} الموافق ${start.day} ${start.month} ${start.year}`;
  return rawDate.trim() ? `وذلك بتاريخ ${rawDate.trim()}` : '';
}

/**
 * Short date for the website's event cards, e.g. "الأربعاء، 7 أكتوبر 2026";
 * the participant's own days ("11 و12 نوفمبر 2026") or the event range ("10 – 12 نوفمبر 2026") when given.
 */
export function formatDisplayDate(
  isoDate: string | null,
  rawDate: string,
  endDate: string | null = null,
  days: string[] = [],
): string {
  const own = days.map(toDateParts).filter((p): p is DateParts => p !== null);
  if (own.length > 1) return joinDayMonthYear(own);
  if (own.length === 1) isoDate = days.find((d) => toDateParts(d)) ?? isoDate;
  const end = !own.length && endDate && isoDate && endDate > isoDate ? toDateParts(endDate) : null;
  const start = isoDate ? toDateParts(isoDate) : null;
  if (start && end) {
    const from = start.year !== end.year ? `${start.day} ${start.month} ${start.year}` : start.month !== end.month ? `${start.day} ${start.month}` : `${start.day}`;
    return `${from} – ${end.day} ${end.month} ${end.year}`;
  }
  const parts = start;
  if (parts) return `${parts.weekday}، ${parts.day} ${parts.month} ${parts.year}`;
  return rawDate.trim();
}
