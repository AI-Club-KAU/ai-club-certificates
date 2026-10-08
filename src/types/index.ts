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
  /** The participant's name as recorded in the attendance sheet. */
  participantName: string;
}

export interface ParticipantQuery {
  fullName: string;
  email: string;
}

/** Event categories that have their own certificate sentence. */
export type EventTypeKey = 'workshop' | 'event' | 'competition' | 'hackathon' | 'meetup' | 'panel';

/** Grammatical gender used in the certificate sentence, derived from الشطر. */
export type Gender = 'male' | 'female';

/** The four dynamic text fields printed on the certificate. */
export interface CertificateContent {
  name: string;
  sentence: string;
  title: string;
  dateLine: string;
}