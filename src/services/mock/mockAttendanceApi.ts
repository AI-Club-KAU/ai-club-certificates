/**
 * DEVELOPMENT ONLY — used when VITE_USE_MOCK_API=true (`npm run dev:mock`).
 * Lets you work on the UI without a deployed Apps Script.
 * All people, IDs and events below are fictional.
 *
 * Try:
 *   ريم أحمد        / 1111111   → 2 events (طالبات; roles حضور, قيادة فريق)
 *   Omar Khalid     / 2222222   → 1 event  (طلاب, role تقديم, long title)
 *   any other input            → no attendance found
 *   any name        / 9999999   → simulated server error
 */
import type { EventMatch, ParticipantQuery } from '../../types';
import { normalizeForMatch } from '../../utils/normalize';
import { normalizeStudentId } from '../../utils/studentId';
import { AttendanceApiError } from '../apiError';

interface MockAttendee {
  fullName: string;
  studentId: string;
  events: Omit<EventMatch, 'participantName'>[];
}

const MOCK_ATTENDEES: MockAttendee[] = [
  {
    fullName: 'ريم أحمد',
    studentId: '1111111',
    events: [
      { eventId: '101', title: 'مقدمة في الذكاء الاصطناعي', type: 'ورشة', section: 'طالبات', role: 'حضور', delivery: 'عن بعد', date: '2026-10-07', dateRaw: '07-10-2026' },
      { eventId: '102', title: 'Generative AI: من الفكرة إلى التطبيق', type: 'هاكاثون', section: 'طالبات', role: 'قيادة فريق', delivery: 'حضوري', date: '2026-09-20', dateRaw: '20-09-2026' },
    ],
  },
  {
    fullName: 'Omar Khalid',
    studentId: '2222222',
    events: [
      { eventId: '103', title: 'أدوات الذكاء الاصطناعي في البحث العلمي وكتابة الأوراق الأكاديمية للطلاب الجامعيين', type: 'Workshop', section: 'طلاب', role: 'تقديم', delivery: '', date: '2026-05-03', dateRaw: '2026-05-03' },
    ],
  },
];

const SIMULATED_DELAY_MS = 700;

export async function findCertificatesMock(query: ParticipantQuery): Promise<EventMatch[]> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  const id = normalizeStudentId(query.studentId);
  if (id === '9999999') throw new AttendanceApiError('server', 'Simulated server error.');

  // Same rule as the Apps Script (MATCH_MODE 'either'): the ID identifies the person;
  // without a matching ID, a first name that belongs to exactly one person.
  const firstName = (value: string) => normalizeForMatch(value).split(' ')[0] ?? '';
  const name = firstName(query.fullName);
  const byId = MOCK_ATTENDEES.find((person) => person.studentId === id);
  const byName = MOCK_ATTENDEES.filter((person) => name !== '' && firstName(person.fullName) === name);
  const attendee = byId ?? (byName.length === 1 ? byName[0] : undefined);
  return attendee ? attendee.events.map((event) => ({ ...event, participantName: attendee.fullName })) : [];
}
