import templateUrl from '../assets/certificate/certificate-template.png';
import type { EventTypeKey, Gender } from '../types';

/**
 * Everything about the certificate in one place.
 * Values come from the official spec "مواصفات قالب شهادة نادي الذكاء الاصطناعي" (latest version):
 * template 3200×2262 px, four centred RTL text fields (centre x = 1600), max width 2512 px, Readex Pro.
 */
export const certificateConfig = {
  templateUrl,
  width: 3200,
  height: 2262,
  fontFamily: 'Readex Pro',

  /** Horizontal centre of every text field. */
  centerX: 1600,
  /** Widest a line may be; longer name/title text shrinks to fit. */
  maxTextWidth: 2512,

  colors: {
    text: '#1a1624',
    title: '#2f8f22',
  },

  /** `y` is the vertical CENTRE of the text, in template pixels. */
  fields: {
    name: { y: 940, size: 108, minSize: 72, weight: 700 },
    sentence: { y: 1134, size: 60, weight: 400 },
    /** One line; shrinks to minSize, and only wraps if it still does not fit. */
    title: { y: 1270, size: 80, minSize: 52, weight: 600, lineHeight: 1.35 },
    date: { y: 1426, size: 60, weight: 400 },
  },

  /** Output files: AI-Club-Certificate-<Name>.pdf / .png */
  fileNamePrefix: 'AI-Club-Certificate',
  pdf: {
    /** PDF page width in points (A4 landscape width); height follows the template ratio. */
    pageWidthPt: 841.89,
    author: 'AI Club — FCIT, King Abdulaziz University',
  },
} as const;

/**
 * The noun used for each event type inside the certificate sentence:
 * "قد شاركت في <ورشة عمل> بعنوان". The verb before it comes from the participant's role
 * (see src/config/roles.ts) and الشطر.
 */
export const eventTypeNouns: Record<EventTypeKey, string> = {
  workshop: 'ورشة عمل',
  event: 'فعالية',
  competition: 'مسابقة',
  hackathon: 'هاكاثون',
  meetup: 'لقاء',
  panel: 'جلسة حوارية',
};

/**
 * طريقة التنفيذ → the words printed after the event type, before "بعنوان":
 *   "قد حضرت ورشة عمل عن بُعد بعنوان".
 * Values not listed here are printed exactly as written in the sheet; an empty cell prints nothing.
 * Add spellings to `labels`; change the printed wording in `text`.
 */
export const deliveryPhrases: { labels: string[]; text: string }[] = [
  { labels: ['عن بعد', 'عن بُعد', 'عن طريق الانترنت', 'اونلاين', 'أونلاين', 'افتراضي', 'افتراضية', 'online', 'remote', 'virtual'], text: 'عن بُعد' },
  { labels: ['حضوري', 'حضورية', 'حضوريا', 'حضوريًا', 'in person', 'in-person', 'onsite', 'on-site'], text: 'حضوريًا' },
  { labels: ['مدمج', 'مدمجة', 'هجين', 'هجينة', 'hybrid', 'حضوري وعن بعد', 'حضوري و عن بعد'], text: 'بشكل مدمج' },
];

/**
 * Role used when the sheet has no role for a participant (or the role is not recognised).
 * Keeps the original behaviour: attendance, except competitions/hackathons → participation.
 */
export const defaultRoleByEventType: Record<EventTypeKey, string> = {
  workshop: 'attendance',
  event: 'attendance',
  competition: 'participation',
  hackathon: 'participation',
  meetup: 'attendance',
  panel: 'attendance',
};

/** Arabic label shown on the website's event cards. */
export const eventTypeLabels: Record<EventTypeKey, string> = {
  workshop: 'ورشة عمل',
  event: 'فعالية',
  competition: 'مسابقة',
  hackathon: 'هاكاثون',
  meetup: 'لقاء',
  panel: 'جلسة حوارية',
};

/**
 * Words that may appear in the sheet's "Event Type" cell for each type.
 * Matching ignores case, extra spaces and Arabic letter variants (ة/ه, أ/ا).
 * Add new spellings here — no other code needs to change.
 */
export const eventTypeAliases: Record<EventTypeKey, string[]> = {
  workshop: ['workshop', 'ورشة', 'ورشة عمل', 'ورش عمل'],
  event: ['event', 'activity', 'فعالية', 'نشاط'],
  competition: ['competition', 'contest', 'challenge', 'مسابقة', 'تحدي'],
  hackathon: ['hackathon', 'هاكاثون', 'هكاثون'],
  meetup: ['meetup', 'meeting', 'lecture', 'talk', 'لقاء', 'محاضرة'],
  panel: ['panel', 'panel discussion', 'discussion', 'جلسة حوارية', 'جلسة نقاش'],
};

/** Used when the sheet's event type is empty or not recognised. */
export const fallbackEventType: EventTypeKey = 'event';

/**
 * الشطر → grammatical gender. Female is checked first.
 * When الشطر is empty or unrecognised, `fallbackGender` is used.
 */
export const sectionGenderKeywords: Record<Gender, string[]> = {
  female: ['طالبات', 'female', 'girls', 'women'],
  male: ['طلاب', 'male', 'boys', 'men'],
};
export const fallbackGender: Gender = 'male';