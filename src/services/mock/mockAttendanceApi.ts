/**
 * DEVELOPMENT ONLY — used when VITE_USE_MOCK_API=true (`npm run dev:mock`).
 * Lets you work on the UI without a deployed Apps Script.
 * All people and events below are fictional.
 *
 * Try:
 *   ريم أحمد        / reem@example.com    → 2 events (طالبات; roles حضور, قيادة فريق)
 *   Omar Khalid     / omar@example.com    → 1 event  (طلاب, role تقديم, long title)
 *   any other input                      → no attendance found
 *   any name        / error@example.com   → simulated server error
 */
import type { EventMatch, ParticipantQuery } from '../../types';
import { normalizeEmail, normalizeForMatch } from '../../utils/normalize';
import { AttendanceApiError } from '../apiError';

interface MockAttendee {
  fullName: string;
  email: string;
  events: Omit<EventMatch, 'participantName'>[];
}

const MOCK_ATTENDEES: MockAttendee[] = [
  {
    fullName: 'ريم أحمد',
    email: 'reem@example.com',
    events: [
      { eventId: '101', title: 'مقدمة في الذكاء الاصطناعي', type: 'ورشة', section: 'طالبات', role: 'حضور', delivery: 'عن بعد', date: '2026-10-07', dateRaw: '07-10-2026' },
      { eventId: '102', title: 'Generative AI: من الفكرة إلى التطبيق', type: 'هاكاثون', section: 'طالبات', role: 'قيادة فريق', delivery: 'حضوري', date: '2026-09-20', dateRaw: '20-09-2026' },
    ],
  },
  {
    fullName: 'Omar Khalid',
    email: 'omar@example.com',
    events: [
      { eventId: '103', title: 'أدوات الذكاء الاصطناعي في البحث العلمي وكتابة الأوراق الأكاديمية للطلاب الجامعيين', type: 'Workshop', section: 'طلاب', role: 'تقديم', delivery: '', date: '2026-05-03', dateRaw: '2026-05-03' },
    ],
  },
];

const SIMULATED_DELAY_MS = 700;

export async function findCertificatesMock(query: ParticipantQuery): Promise<EventMatch[]> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  const email = normalizeEmail(query.email);
  if (email === 'error@example.com') throw new AttendanceApiError('server', 'Simulated server error.');

  // Same rule as the Apps Script (MATCH_MODE 'either'): first name OR email.
  const firstName = (value: string) => normalizeForMatch(value).split(' ')[0] ?? '';
  const name = firstName(query.fullName);
  const attendee = MOCK_ATTENDEES.find(
    (person) => normalizeEmail(person.email) === email || (name !== '' && firstName(person.fullName) === name),
  );
  return attendee ? attendee.events.map((event) => ({ ...event, participantName: attendee.fullName })) : [];
}