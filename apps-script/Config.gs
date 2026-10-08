/**
 * AI Club Certificates — Apps Script configuration.
 *
 * Everything that describes the SPREADSHEET LAYOUT lives here, so the club can
 * adapt to a changed sheet without touching the search logic in Code.gs.
 *
 * Labels are matched after normalisation (case-insensitive, extra spaces and
 * trailing ":" ignored, Arabic letter variants unified). A bilingual label such
 * as "Section / الشطر" or "Full Name (الاسم الكامل)" matches if ANY part of it
 * matches one of the aliases below.
 */
const CONFIG = {
  /**
   * Leave empty when this script is bound to the spreadsheet
   * (opened from the sheet via Extensions → Apps Script) — recommended.
   * For a standalone script, paste the spreadsheet ID here.
   */
  SPREADSHEET_ID: '',

  /** Tabs whose name starts with this prefix are never searched (templates, drafts, notes). */
  IGNORED_SHEET_PREFIX: '_',

  /** Exact tab names that are never searched. */
  IGNORED_SHEETS: [],

  /**
   * Tabs whose name contains any of these words are skipped, so a registration
   * tab can never grant a certificate. Attendance is the only source of truth.
   */
  REGISTRATION_SHEET_KEYWORDS: ['registration', 'register', 'تسجيل', 'التسجيل', 'المسجلين'],

  /**
   * Name of the tab that lists all events (one row per event). Leave empty to
   * detect it automatically: the first tab whose header row has an event-title
   * column plus a date, type or الشطر column (and no email column).
   */
  EVENTS_SHEET_NAME: '',

  /**
   * Optional column in the events tab holding the exact name of that event's
   * attendance tab. Without it, attendance tabs are matched to events by title.
   */
  EVENTS_SHEET_COLUMN_LABELS: ['attendance sheet', 'sheet', 'tab', 'شيت الحضور', 'اسم شيت الحضور', 'ورقة الحضور', 'تبويب الحضور'],

  /**
   * Event information — column headers in the events tab, or (fallback) labels
   * inside an attendance tab: a label cell followed by its value
   * (value in the next non-empty cell to the right, or directly below).
   * "Label: value" written inside a single cell also works.
   */
  EVENT_FIELD_LABELS: {
    title: ['event title', 'event name', 'event', 'title', 'عنوان الفعالية', 'اسم الفعالية', 'الفعالية', 'عنوان الورشة', 'اسم الورشة', 'العنوان'],
    date: ['event date', 'date', 'تاريخ الفعالية', 'التاريخ', 'تاريخ الورشة', 'اليوم والتاريخ'],
    type: ['event type', 'type', 'نوع الفعالية', 'النوع', 'نوعها'],
    section: ['section', 'الشطر'],
  },

  /**
   * Attendance table header row. A row is treated as the attendance header when
   * it contains BOTH a name column and an email column.
   */
  ATTENDANCE_COLUMN_LABELS: {
    name: ['full name', 'name', 'الاسم الكامل', 'الاسم', 'الاسم الثلاثي', 'الاسم الرباعي', 'اسم الطالب', 'اسم الطالبة', 'اسم المشارك', 'اسم المشاركة'],
    email: [
      'email', 'e-mail', 'email address', 'university email',
      'البريد الإلكتروني', 'البريد', 'الإيميل', 'الايميل',
      'البريد الجامعي', 'الإيميل الجامعي', 'البريد الإلكتروني الجامعي',
    ],
    /** Optional per-row الشطر. When present it overrides the event-level value. */
    section: ['section', 'الشطر'],
    /**
     * Optional attendance status column (e.g. a checkbox). When present, only rows
     * marked as attended count. When absent, every row in the table counts.
     */
    attended: ['attended', 'attendance', 'present', 'الحضور', 'حضر', 'حاضر', 'حالة الحضور'],
  },

  /**
   * When a tab has no event-title cell, the tab name is used as the title.
   * These prefixes are removed from it first, e.g. "حضور - Introduction to AI" → "Introduction to AI".
   */
  TITLE_PREFIXES_TO_STRIP: ['حضور', 'الحضور', 'تحضير', 'attendance'],

  /** Values accepted as "attended" in the optional status column. */
  ATTENDED_TRUE_VALUES: ['true', 'yes', 'y', '1', 'x', '✓', '✔', 'نعم', 'حاضر', 'حاضرة', 'حضر', 'حضرت'],

  /** Defensive input limits. */
  MAX_NAME_LENGTH: 150,
  MAX_EMAIL_LENGTH: 254,
};