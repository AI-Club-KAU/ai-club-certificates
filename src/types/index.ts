/** One event the participant attended, as returned by the attendance API. */
export interface EventMatch {
  /** Unique per certificate: the event worksheet id, plus the role when the sheet has one. */
  eventId: string;
  title: string;
  /** Event type exactly as written in the sheet, e.g. "ورشة" or "Workshop". */
  type: string;
  /** الشطر exactly as written in the sheet, e.g. "طالبات" or "طلاب". */
  section: string;
  /**
   * The participant's role as written in the sheet ("حضور", "مشاركة", "تنظيم", …),
   * or '' when the sheet has no role column. Mapped to a verb by src/config/roles.ts.
   */
  role: string;
  /** طريقة التنفيذ as written in the events tab ("عن بعد", "حضوري", …), or ''. */
  delivery: string;
  /** ISO date "yyyy-MM-dd", or null if the sheet date could not be read. */
  date: string | null;
  /** The date as written in the sheet; used for display when `date` is null. */
  dateRaw: string;
  /** Last day of a multi-day event (ISO), or null. Optional: older API versions omit it. */
  endDate?: string | null;
  /**
   * The participant's own days (ISO, sorted), e.g. the booth days they stood.
   * Printed instead of the event date when not empty. Optional: older API versions omit it.
   */
  days?: string[];
  /** The participant's name as recorded in the attendance sheet. */
  participantName: string;
}

export interface ParticipantQuery {
  fullName: string;
  /** الرقم الجامعي */
  studentId: string;
}

/** Event categories that have their own certificate sentence. */
export type EventTypeKey = 'workshop' | 'event' | 'competition' | 'hackathon' | 'meetup' | 'panel' | 'exhibition';

/** Grammatical gender used in the certificate sentence, derived from الشطر. */
export type Gender = 'male' | 'female';

/** The three kinds of certificate: attendance, participation, thanks (organising / club work). */
export type CertificateKind = 'attendance' | 'participation' | 'thanks';

/** The dynamic text fields printed on the certificate. */
export interface CertificateContent {
  kind: CertificateKind;
  /** "شهادة حضور" / "شهادة مشاركة" / "شهادة شكر وتقدير" */
  heading: string;
  /** "يشهد نادي الذكاء الاصطناعي بجامعة الملك عبدالعزيز بأن" … */
  opening: string;
  name: string;
  sentence: string;
  title: string;
  dateLine: string;
}
