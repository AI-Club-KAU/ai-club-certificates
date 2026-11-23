/**
 * AI Club Certificates — Apps Script API (single file).
 * Paste this whole file into the one script file in the Apps Script editor
 * (named "Code.gs" or "الرمز.gs"), then deploy a new version.
 * Sections: 1) CONFIG  2) search API  3) admin tools (diagnose, testSearch, setupTemplateSheet).
 */

/**
 * 1) CONFIG — Apps Script configuration.
 *
 * Everything that describes the SPREADSHEET LAYOUT lives here, so the club can
 * adapt to a changed sheet without touching the search logic below.
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

  /**
   * ONLY tabs whose name starts with one of these words give certificates,
   * e.g. "حضور _ مقدمة في الذكاء الاصطناعي" or "حضور - Introduction to AI".
   * Any other tab (even one with names and student IDs) is never searched.
   * The events tab is not affected by this rule.
   */
  CERTIFICATE_SHEET_PREFIXES: ['حضور'],

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
    date: ['event date', 'date', 'start date', 'تاريخ الفعالية', 'التاريخ', 'تاريخ الورشة', 'اليوم والتاريخ', 'تاريخ البداية'],
    /** Optional last day of a multi-day event → "وذلك خلال الفترة من 10 إلى 12 نوفمبر 2026". */
    endDate: ['end date', 'تاريخ النهاية', 'تاريخ الانتهاء', 'آخر يوم'],
    type: ['event type', 'type', 'نوع الفعالية', 'النوع', 'نوعها'],
    section: ['section', 'الشطر'],
    /** How the event was delivered, e.g. "عن بعد" / "حضوري". Printed before "بعنوان". */
    delivery: ['طريقة التنفيذ', 'نمط التنفيذ', 'طريقة الحضور', 'طريقة الإقامة', 'delivery', 'delivery mode', 'mode'],
    /**
     * Optional default role for everyone in that event's attendance tab (e.g. "تمثيل" for a booth team).
     * A role written in the attendance row itself still wins.
     */
    role: ['الدور', 'الدور الافتراضي', 'دور المشاركين', 'role', 'default role'],
  },

  /**
   * Attendance table header row. A row is treated as the attendance header when
   * it contains a name column AND a student-ID column (or, for older tabs, an email column).
   */
  ATTENDANCE_COLUMN_LABELS: {
    name: ['full name', 'name', 'الاسم الكامل', 'الاسم', 'الاسم الثلاثي', 'الاسم الرباعي', 'اسم الطالب', 'اسم الطالبة', 'اسم المشارك', 'اسم المشاركة'],
    /** The university ID — this is what participants type on the website. */
    studentId: [
      'الرقم الجامعي', 'رقم جامعي', 'الرقم الجامعى', 'رقم الطالب', 'رقم الطالبة', 'الرقم الأكاديمي',
      'رقم القيد', 'student id', 'student number', 'university id', 'id',
    ],
    /** Only used to recognise older attendance tabs; emails are no longer compared. */
    email: [
      'email', 'e-mail', 'email address', 'university email',
      'البريد الإلكتروني', 'البريد', 'الإيميل', 'الايميل',
      'البريد الجامعي', 'الإيميل الجامعي', 'البريد الإلكتروني الجامعي',
    ],
    /** Optional per-row الشطر. When present it overrides the event-level value. */
    section: ['section', 'الشطر'],
    /**
     * Optional role column (e.g. chosen in the Google Form: "حضور", "مشاركة", "تنظيم").
     * The website turns it into the right verb for الشطر. Without it, the website uses
     * its default role for the event type (attendance, or participation for competitions).
     */
    role: ['الدور', 'دور', 'دور المشارك', 'دور المشاركة', 'نوع المشاركة', 'الصفة', 'role'],
    /**
     * Optional per-person days (e.g. a Google Form checkbox question for a booth: which days did you
     * stand?). Write each option with its date: "الثلاثاء 11/11/2026". When filled, these days are
     * printed instead of the event date. Several rows of the same person are merged.
     */
    days: ['الأيام', 'أيام الوقوف', 'أيام الحضور', 'تاريخ الحضور', 'تاريخ الوقوف', 'الأيام التي وقفت فيها', 'days'],
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

  /**
   * How a participant is matched to an attendance row:
   *   'either' — the student ID OR the first name may be right, but the name stays tied to its ID:
   *              • ID found → only that person's rows (people sharing the first name are excluded);
   *              • ID not found → the name must point to ONE person (typing the family name
   *                helps when several share a first name); otherwise nothing is shown.
   *   'both'   — first name AND student ID must both match (strictest).
   * The name printed on the certificate always comes from the sheet.
   */
  MATCH_MODE: 'either',

  /** Defensive input limits. */
  MAX_NAME_LENGTH: 150,
  MAX_ID_LENGTH: 12,
};

/**
 * AI Club Certificates — attendance lookup API (Google Apps Script Web App).
 *
 * POST body (JSON, sent as text/plain to avoid a CORS preflight):
 *   { "action": "findCertificates", "fullName": "...", "studentId": "..." }
 *
 * Success:  { "ok": true, "data": { "matches": [ EventMatch, ... ] } }
 * Failure:  { "ok": false, "error": { "code": "...", "message": "..." } }
 *
 * EventMatch = {
 *   eventId, title, type, section,
 *   role      // the participant's role as written in the sheet (or the event's default role), or ""
 *   delivery  // طريقة التنفيذ from the events tab ("عن بعد", "حضوري", …), or ""
 *   date      // "yyyy-MM-dd" when the sheet date could be read, otherwise null
 *   dateRaw   // the date exactly as written in the sheet (fallback for display)
 *   endDate   // last day of a multi-day event ("yyyy-MM-dd"), or null
 *   days      // the participant's own days (["yyyy-MM-dd", …], sorted), or [] — printed instead of the event date
 *   participantName // the name as recorded in the attendance sheet
 * }
 *
 * Only the requesting participant's own matches are ever returned.
 * Layout settings live in CONFIG at the top of this file.
 */

// ---------------------------------------------------------------------------
// HTTP entry points
// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    const body = parseBody_(e);
    if (body.action && body.action !== 'findCertificates') {
      return json_({ ok: false, error: { code: 'UNKNOWN_ACTION', message: 'Unknown action.' } });
    }

    const fullName = String(body.fullName || '');
    const studentId = String(body.studentId || '');
    const inputError = validateInput_(fullName, studentId);
    if (inputError) {
      return json_({ ok: false, error: { code: 'INVALID_INPUT', message: inputError } });
    }

    const matches = findCertificates_(fullName, studentId);
    return json_({ ok: true, data: { matches: matches } });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: { code: 'SERVER_ERROR', message: 'Unexpected server error.' } });
  }
}

/** Health check: open the Web App URL in a browser to confirm the deployment works. */
function doGet() {
  return json_({ ok: true, data: { service: 'ai-club-certificates', status: 'running' } });
}

// ---------------------------------------------------------------------------
// Core search
// ---------------------------------------------------------------------------

/**
 * Searches every attendance tab for the participant (see CONFIG.MATCH_MODE).
 * Event details come from the events tab (one row per event) when it exists,
 * otherwise from labelled cells inside the attendance tab, otherwise the tab name.
 */
function findCertificates_(fullName, studentId) {
  const wantedName = firstNameKey_(fullName);
  const wantedId = normalizeStudentId_(studentId);
  const spreadsheet = getSpreadsheet_();
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  const tabs = readTabs_(spreadsheet);
  const eventsTable = findEventsTable_(tabs);

  // 1) Every attended row whose student ID OR first name matches, in every attendance tab.
  const candidates = [];
  tabs.forEach(function (tab) {
    if (tab.skipReason || (eventsTable && tab === eventsTable.tab)) return;
    if (!isCertificateSheet_(tab.name)) return; // only "حضور _ ..." tabs give certificates
    const layout = detectLayout_(tab.values);
    if (!layout.attendance) return; // not an attendance tab
    findAttendanceRows_(tab.values, layout.attendance, wantedName, wantedId).forEach(function (row) {
      const a = layout.attendance;
      candidates.push({
        tab: tab,
        layout: layout,
        row: row,
        idOk: Boolean(wantedId) && rowStudentId_(row, a) === wantedId,
        nameKey: normalizeName_(cellText_(row[a.nameCol])),
      });
    });
  });

  // 2) Keep only the rows that belong to THIS participant.
  const own = pickParticipantRows_(candidates, fullName);

  // 3) One certificate per event, person and role. Several rows of the same person and role
  //    (e.g. one booth form per day) are merged into one certificate listing all their days.
  const matches = [];
  const byKey = {};
  const eventCache = {};
  own.forEach(function (c) {
    const a = c.layout.attendance;
    const record = c.row;

    if (!eventCache[c.tab.name]) {
      const ev = resolveEvent_(c.tab.name, c.layout.event, eventsTable);
      eventCache[c.tab.name] = {
        event: ev,
        date: readDate_(ev.date, timeZone),
        endDate: readDate_(ev.endDate, timeZone),
        count: 0,
      };
    }
    const cached = eventCache[c.tab.name];

    const rowRole = a.roleCol >= 0 ? collapseSpaces_(cellText_(record[a.roleCol])) : '';
    const role = rowRole || collapseSpaces_(cellText_(cached.event.role));
    const days = a.daysCol >= 0 ? readDays_(record[a.daysCol], timeZone) : [];
    const key = c.tab.name + '|' + c.nameKey + '|' + rowStudentId_(record, a) + '|' + normalizeLabel_(role);

    const existing = byKey[key];
    if (existing) {
      existing.days = mergeDays_(existing.days, days);
      return;
    }

    cached.count += 1;
    const rowSection = a.sectionCol >= 0 ? cellText_(record[a.sectionCol]) : '';
    const match = {
      eventId: String(c.tab.sheet.getSheetId()) + ':' + cached.count,
      title: cellText_(cached.event.title),
      type: cellText_(cached.event.type),
      section: rowSection || cellText_(cached.event.section),
      role: role,
      delivery: cellText_(cached.event.delivery),
      date: cached.date.iso,
      dateRaw: cached.date.raw,
      endDate: cached.endDate.iso,
      days: days,
      participantName: collapseSpaces_(cellText_(record[a.nameCol])),
    };
    byKey[key] = match;
    matches.push(match);
  });

  // Per-person days: the first one dates the card when the event itself has no date.
  matches.forEach(function (m) {
    if (!m.date && m.days.length) m.date = m.days[0];
  });

  // Newest events first; undated events last.
  matches.sort(function (a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
  return matches;
}

/**
 * Decides which candidate rows belong to the person searching, so several people
 * who share a first name never see each other's certificates.
 *
 *  - The student ID matched somewhere → the ID identifies the person: their rows, plus
 *    rows in other tabs with exactly the same full name (e.g. an older tab without an
 *    ID column). Rows that only share the first name are dropped.
 *  - The ID matched nowhere → the name alone must point to ONE person. If only one
 *    person has that first name, it is them. If several do, the other words typed
 *    (father / family name) must narrow it to one; otherwise nothing is returned and
 *    the participant should check their student ID.
 */
function pickParticipantRows_(candidates, typedName) {
  if (CONFIG.MATCH_MODE === 'both') return candidates; // already name AND student ID

  const byId = candidates.filter(function (c) { return c.idOk; });
  if (byId.length) {
    const sameFullName = {};
    byId.forEach(function (c) {
      if (c.nameKey.split(' ').length >= 2) sameFullName[c.nameKey] = true;
    });
    return candidates.filter(function (c) { return c.idOk || sameFullName[c.nameKey]; });
  }

  const onePerson = function (rows) {
    const people = {};
    rows.forEach(function (c) { people[c.nameKey] = true; });
    return Object.keys(people).length === 1;
  };
  if (onePerson(candidates)) return candidates;

  // Several people share this first name: narrow with the other words typed.
  const typedParts = nameParts_(typedName).slice(1);
  if (!typedParts.length) return [];
  const fitting = candidates.filter(function (c) {
    const rowParts = nameParts_(c.nameKey).slice(1);
    return typedParts.every(function (part) { return rowParts.indexOf(part) !== -1; });
  });
  return onePerson(fitting) ? fitting : [];
}

/** Name words with compound first names joined ("عبد الله" → "عبدالله"). */
function nameParts_(value) {
  const parts = normalizeName_(value).split(' ').filter(Boolean);
  const prefixes = ['عبد', 'ابو', 'ام', 'بن', 'ال'];
  if (parts.length > 1 && prefixes.indexOf(parts[0]) !== -1) parts.splice(0, 2, parts[0] + parts[1]);
  return parts;
}

/** Reads every tab once: { sheet, name, values, skipReason }. */
function readTabs_(spreadsheet) {
  return spreadsheet.getSheets().map(function (sheet) {
    const name = sheet.getName();
    const skipReason = getSkipReason_(name);
    return { sheet: sheet, name: name, skipReason: skipReason, values: skipReason ? [] : sheet.getDataRange().getValues() };
  });
}

// ---------------------------------------------------------------------------
// Events tab (one row per event)
// ---------------------------------------------------------------------------

/**
 * Finds the tab that lists all events. Uses CONFIG.EVENTS_SHEET_NAME when set;
 * otherwise the first tab with a header row that has an event-title column plus
 * at least one of date / type / الشطر, and no attendance table (name + email).
 * Returns null when the spreadsheet has no such tab.
 */
function findEventsTable_(tabs) {
  const candidates = CONFIG.EVENTS_SHEET_NAME
    ? tabs.filter(function (t) { return t.name === CONFIG.EVENTS_SHEET_NAME; })
    : tabs;
  for (let i = 0; i < candidates.length; i++) {
    const tab = candidates[i];
    if (tab.skipReason && !CONFIG.EVENTS_SHEET_NAME) continue;
    const values = tab.values.length ? tab.values : tab.sheet.getDataRange().getValues();
    if (detectAttendanceHeader_(values)) continue; // attendance tabs are never the events list
    const table = parseEventsTable_(values);
    if (table) {
      table.tab = tab;
      return table;
    }
  }
  return null;
}

function parseEventsTable_(values) {
  const labels = CONFIG.EVENT_FIELD_LABELS;
  for (let r = 0; r < values.length; r++) {
    const row = values[r];
    const cols = {
      title: findColumn_(row, labels.title),
      date: findColumn_(row, labels.date),
      type: findColumn_(row, labels.type),
      section: findColumn_(row, labels.section),
      delivery: findColumn_(row, labels.delivery),
      endDate: findColumn_(row, labels.endDate),
      role: findColumn_(row, labels.role),
      sheet: findColumn_(row, CONFIG.EVENTS_SHEET_COLUMN_LABELS),
    };
    if (cols.title < 0 || (cols.date < 0 && cols.type < 0 && cols.section < 0)) continue;

    const events = [];
    for (let rr = r + 1; rr < values.length; rr++) {
      const v = values[rr];
      const title = cellText_(v[cols.title]);
      if (!title) continue;
      events.push({
        title: title,
        date: cols.date >= 0 ? v[cols.date] : '',
        type: cols.type >= 0 ? v[cols.type] : '',
        section: cols.section >= 0 ? v[cols.section] : '',
        delivery: cols.delivery >= 0 ? v[cols.delivery] : '',
        endDate: cols.endDate >= 0 ? v[cols.endDate] : '',
        role: cols.role >= 0 ? v[cols.role] : '',
        sheetName: cols.sheet >= 0 ? cellText_(v[cols.sheet]) : '',
      });
    }
    return { headerRow: r, cols: cols, events: events };
  }
  return null;
}

/**
 * Picks the events-tab row for an attendance tab:
 *   1. a row whose "attendance sheet" column equals the tab name;
 *   2. a row whose title equals the tab name (prefixes like "حضور -" removed);
 *   3. a row whose title is contained in the tab name, or the other way round.
 * When several rows share a title, the one whose الشطر appears in the tab name wins.
 */
function findEventRow_(tabName, eventsTable) {
  if (!eventsTable) return null;
  const tabKey = normalizeLabel_(tabName);
  const titleKey = normalizeLabel_(titleFromSheetName_(tabName));
  const events = eventsTable.events;

  const bySheet = events.filter(function (e) { return e.sheetName && normalizeLabel_(e.sheetName) === tabKey; });
  if (bySheet.length) return bySheet[0];

  let found = events.filter(function (e) { return normalizeLabel_(e.title) === titleKey; });
  if (!found.length) {
    found = events.filter(function (e) {
      const t = normalizeLabel_(e.title);
      return t.length >= 4 && (tabKey.indexOf(t) !== -1 || t.indexOf(titleKey) !== -1 && titleKey.length >= 4);
    });
    // "Introduction to AI Ethics" must beat "Introduction to AI" for a tab named after the former.
    found.sort(function (a, b) { return normalizeLabel_(b.title).length - normalizeLabel_(a.title).length; });
  }
  if (found.length > 1) {
    const bySection = found.filter(function (e) {
      const sec = normalizeLabel_(cellText_(e.section));
      return sec && tabKey.indexOf(sec) !== -1;
    });
    if (bySection.length) return bySection[0];
  }
  return found[0] || null;
}

/** Merges event details: events tab first, then labelled cells in the tab, then the tab name. */
function resolveEvent_(tabName, inTab, eventsTable) {
  const row = findEventRow_(tabName, eventsTable) || {};
  const pick = function (key) {
    return !isBlank_(row[key]) ? row[key] : inTab[key];
  };
  return {
    title: cellText_(pick('title')) || titleFromSheetName_(tabName),
    date: pick('date'),
    type: pick('type'),
    section: pick('section'),
    delivery: pick('delivery'),
    endDate: pick('endDate'),
    role: pick('role'),
    fromEventsTab: Boolean(row.title),
  };
}

/**
 * True when the tab name starts with one of CONFIG.CERTIFICATE_SHEET_PREFIXES followed by a
 * space or a separator: "حضور _ X", "حضور - X", "حضور: X", "حضور X" → true;
 * "حضورية", "ورشة X", "الحضور الكلي" → false.
 */
function isCertificateSheet_(name) {
  const text = normalizeName_(name);
  return CONFIG.CERTIFICATE_SHEET_PREFIXES.some(function (prefix) {
    const p = normalizeName_(prefix);
    if (!p || text.indexOf(p) !== 0) return false;
    const next = text.charAt(p.length);
    return next === '' || /[\s\-–—:|_]/.test(next);
  });
}

/** "حضور _ Introduction to AI" → "Introduction to AI" (see CONFIG.TITLE_PREFIXES_TO_STRIP). */
function titleFromSheetName_(name) {
  let title = String(name).trim();
  CONFIG.TITLE_PREFIXES_TO_STRIP.forEach(function (prefix) {
    const pattern = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[-–—:|_]\\s*', 'i');
    title = title.replace(pattern, '');
  });
  return title.trim() || String(name).trim();
}

/**
 * Every row in the attendance table that matches the participant (see CONFIG.MATCH_MODE):
 * first name compared, not the full name; student ID compared as digits (spaces, Arabic digits
 * and leading zeros ignored).
 * `wantedName` is a first-name key from firstNameKey_().
 */
function findAttendanceRows_(values, attendance, wantedName, wantedId) {
  const needBoth = CONFIG.MATCH_MODE === 'both';
  const rows = [];
  for (let r = attendance.headerRow + 1; r < values.length; r++) {
    const row = values[r];
    const rowName = firstNameKey_(cellText_(row[attendance.nameCol]));
    const idOk = Boolean(wantedId) && rowStudentId_(row, attendance) === wantedId;
    const nameOk = Boolean(wantedName) && rowName === wantedName;
    if (needBoth ? !(idOk && nameOk) : !(idOk || nameOk)) continue;
    if (attendance.attendedCol >= 0 && !isAttended_(row[attendance.attendedCol])) continue;
    rows.push(row);
  }
  return rows;
}

/**
 * First-name comparison key. Compound first names stay together:
 * "عبد الله أحمد" and "عبدالله أحمد" → "عبدالله"; "أبو بكر" → "ابوبكر".
 */
function firstNameKey_(value) {
  const parts = normalizeName_(value).split(' ').filter(Boolean);
  if (!parts.length) return '';
  const prefixes = ['عبد', 'ابو', 'ام', 'بن', 'ال'];
  if (parts.length > 1 && prefixes.indexOf(parts[0]) !== -1) return parts[0] + parts[1];
  return parts[0];
}

function isAttended_(value) {
  if (value === true) return true;
  if (value === false || value === null || value === '') return false;
  const text = normalizeLabel_(String(value));
  return CONFIG.ATTENDED_TRUE_VALUES.some(function (v) {
    return normalizeLabel_(v) === text;
  });
}

// ---------------------------------------------------------------------------
// Layout detection
// ---------------------------------------------------------------------------

/**
 * Finds the attendance header row and the event information cells in one tab.
 * Returns { attendance: null | {...}, event: { title, date, type, section, delivery } }.
 */
function detectLayout_(values) {
  const attendance = detectAttendanceHeader_(values);
  const event = { title: '', date: '', type: '', section: '', delivery: '', endDate: '', role: '' };
  const fieldKeys = Object.keys(CONFIG.EVENT_FIELD_LABELS);

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      // Never read event info out of the attendance table itself.
      if (attendance && r >= attendance.headerRow && c >= attendance.firstCol && c <= attendance.lastCol) continue;

      const raw = values[r][c];
      if (typeof raw !== 'string' || !raw.trim()) continue;

      for (let k = 0; k < fieldKeys.length; k++) {
        const key = fieldKeys[k];
        if (event[key] !== '') continue;
        const found = readLabelledValue_(values, r, c, CONFIG.EVENT_FIELD_LABELS[key]);
        if (found !== null) {
          event[key] = found;
          break;
        }
      }
    }
  }
  return { attendance: attendance, event: event };
}

function detectAttendanceHeader_(values) {
  const labels = CONFIG.ATTENDANCE_COLUMN_LABELS;
  for (let r = 0; r < values.length; r++) {
    const row = values[r];
    const nameCol = findColumn_(row, labels.name);
    const idCol = findColumn_(row, labels.studentId);
    const emailCol = findColumn_(row, labels.email);
    if (nameCol < 0 || (idCol < 0 && emailCol < 0)) continue;

    const sectionCol = findColumn_(row, labels.section);
    const attendedCol = findColumn_(row, labels.attended);
    const roleCol = findColumn_(row, labels.role);
    const daysCol = findColumn_(row, labels.days);
    const cols = [nameCol, idCol, emailCol, sectionCol, attendedCol, roleCol, daysCol].filter(function (c) { return c >= 0; });
    return {
      headerRow: r,
      nameCol: nameCol,
      idCol: idCol,
      emailCol: emailCol,
      sectionCol: sectionCol,
      attendedCol: attendedCol,
      roleCol: roleCol,
      daysCol: daysCol,
      firstCol: Math.min.apply(null, cols),
      lastCol: Math.max.apply(null, cols),
    };
  }
  return null;
}

function findColumn_(row, aliases) {
  for (let c = 0; c < row.length; c++) {
    if (typeof row[c] === 'string' && labelMatches_(row[c], aliases)) return c;
  }
  return -1;
}

/**
 * If the cell at (r, c) is a label from `aliases`, returns its value:
 *   "Label: value" in the same cell → "value"
 *   otherwise the next non-empty cell to the right, or the cell directly below.
 * Returns null when the cell is not a matching label.
 */
function readLabelledValue_(values, r, c, aliases) {
  const text = String(values[r][c]);
  const colonIndex = text.search(/[:：]/);
  if (colonIndex > 0 && labelMatches_(text.slice(0, colonIndex), aliases)) {
    const inline = text.slice(colonIndex + 1).trim();
    if (inline) return inline;
  }
  if (!labelMatches_(text, aliases)) return null;

  const below = r + 1 < values.length ? values[r + 1][c] : '';
  for (let cc = c + 1; cc < values[r].length; cc++) {
    const right = values[r][cc];
    if (isBlank_(right)) continue;
    // Labels laid out as a header row (values underneath): the next cell is another label.
    if (isEventLabel_(right)) break;
    return right;
  }
  return isBlank_(below) ? '' : below;
}

function isEventLabel_(value) {
  if (typeof value !== 'string') return false;
  const labels = CONFIG.EVENT_FIELD_LABELS;
  return Object.keys(labels).some(function (key) {
    return labelMatches_(value, labels[key]);
  });
}

function labelMatches_(text, aliases) {
  const whole = normalizeLabel_(text);
  if (!whole) return false;
  const parts = [whole].concat(
    String(text).split(/[\/|()\[\]\-–—]/).map(normalizeLabel_).filter(Boolean)
  );
  return aliases.some(function (alias) {
    const a = normalizeLabel_(alias);
    return parts.indexOf(a) !== -1;
  });
}

function getSkipReason_(sheetName) {
  if (CONFIG.IGNORED_SHEET_PREFIX && sheetName.indexOf(CONFIG.IGNORED_SHEET_PREFIX) === 0) return 'ignored prefix';
  if (CONFIG.IGNORED_SHEETS.indexOf(sheetName) !== -1) return 'in IGNORED_SHEETS';
  const lower = sheetName.toLowerCase();
  const keyword = CONFIG.REGISTRATION_SHEET_KEYWORDS.find(function (k) {
    return lower.indexOf(k.toLowerCase()) !== -1;
  });
  return keyword ? 'registration tab ("' + keyword + '")' : '';
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Returns { iso: "yyyy-MM-dd" | null, raw: string }. Text dates are read day-first. */
function readDate_(value, timeZone) {
  if (isDate_(value) && !isNaN(value.getTime())) {
    const iso = Utilities.formatDate(value, timeZone, 'yyyy-MM-dd');
    return { iso: iso, raw: iso };
  }
  const raw = cellText_(value);
  const text = toLatinDigits_(raw);
  let m = text.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (m) return { iso: buildIso_(m[1], m[2], m[3]), raw: raw };
  m = text.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (m) return { iso: buildIso_(m[3], m[2], m[1]), raw: raw };
  return { iso: null, raw: raw };
}

/**
 * A per-person days cell → sorted ISO dates. Accepts a real date cell, or text holding one or
 * more dates, e.g. a Google Form checkbox answer "الثلاثاء 11/11/2026, الأربعاء 12/11/2026"
 * (day first, as in Saudi Arabia) or "2026-11-11". Anything else in the text is ignored.
 */
function readDays_(value, timeZone) {
  if (isDate_(value)) {
    const one = readDate_(value, timeZone);
    return one.iso ? [one.iso] : [];
  }
  const text = toLatinDigits_(cellText_(value));
  const found = [];
  const pattern = /(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})|(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/g;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const iso = m[1] ? buildIso_(m[1], m[2], m[3]) : buildIso_(m[6], m[5], m[4]);
    if (iso) found.push(iso);
  }
  return mergeDays_([], found);
}

/** Union of two ISO date lists, sorted, without duplicates. */
function mergeDays_(a, b) {
  const set = {};
  a.concat(b).forEach(function (d) { set[d] = true; });
  return Object.keys(set).sort();
}

function buildIso_(year, month, day) {
  const y = Number(year), mo = Number(month), d = Number(day);
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return y + '-' + pad2_(mo) + '-' + pad2_(d);
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

// ---------------------------------------------------------------------------
// Normalisation (keep in sync with src/utils/normalize.ts)
// ---------------------------------------------------------------------------

/**
 * Tolerant but strict name comparison key:
 * trims, collapses spaces, ignores case, removes Arabic diacritics/tatweel and
 * invisible characters, unifies أ/إ/آ→ا, ة→ه, ى→ي. Different names stay different.
 * (Invisible characters are written as \u escapes so copy-paste cannot lose them.)
 */
function normalizeName_(value) {
  return collapseSpaces_(
    String(value || '')
      .normalize('NFKC')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase()
  );
}

function normalizeEmail_(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s\u200B-\u200F\uFEFF]/g, '')
    .toLowerCase();
}

/** "٢٢١٠٠٤٥", " 2210045 ", "02210045" and the number 2210045 all → "2210045". */
function normalizeStudentId_(value) {
  return toLatinDigits_(String(value === null || value === undefined ? '' : value))
    .replace(/[^0-9A-Za-z]/g, '')
    .replace(/^0+(?=.)/, '')
    .toUpperCase();
}

/** The row's student ID, or "" when the tab has no ID column. */
function rowStudentId_(row, attendance) {
  return attendance.idCol >= 0 ? normalizeStudentId_(row[attendance.idCol]) : '';
}

function normalizeLabel_(value) {
  return normalizeName_(value).replace(/[:：*]+$/g, '').trim();
}

function collapseSpaces_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toLatinDigits_(value) {
  return String(value)
    .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
    .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x06f0); })
    .trim();
}

function cellText_(value) {
  if (value === null || value === undefined) return '';
  if (isDate_(value)) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value).trim();
}

function isDate_(value) {
  return Object.prototype.toString.call(value) === '[object Date]';
}

function isBlank_(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }
  return (e && e.parameter) || {};
}

function validateInput_(fullName, studentId) {
  const name = collapseSpaces_(fullName);
  const id = normalizeStudentId_(studentId);
  if (!name || !id) return 'Full name and student ID are required.';
  if (name.length > CONFIG.MAX_NAME_LENGTH || id.length > CONFIG.MAX_ID_LENGTH) return 'Input is too long.';
  if (!/^[0-9]{5,12}$/.test(id)) return 'Student ID is not valid.';
  return '';
}

function getSpreadsheet_() {
  return CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Admin helpers — run these manually from the Apps Script editor
 * (select the function in the toolbar, then click "Run"). They are NOT
 * reachable from the website.
 */

/**
 * Prints what the API detects on every tab: event info, attendance columns and
 * the NUMBER of attendance rows. It never prints student names or IDs.
 * Run this after creating a new event tab to confirm it will be searched.
 */
function diagnose() {
  const spreadsheet = getSpreadsheet_();
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  const tabs = readTabs_(spreadsheet);
  const eventsTable = findEventsTable_(tabs);
  const lines = ['Spreadsheet: ' + spreadsheet.getName() + ' (time zone ' + timeZone + ')', ''];
  const col = function (i) { return i >= 0 ? columnLetter_(i) : '—'; };

  if (eventsTable) {
    const c = eventsTable.cols;
    lines.push('📋 Events tab: "' + eventsTable.tab.name + '" — header row ' + (eventsTable.headerRow + 1) +
      ' → title ' + col(c.title) + ', date ' + col(c.date) + ', type ' + col(c.type) +
      ', الشطر ' + col(c.section) + ', طريقة التنفيذ ' + col(c.delivery) + ', تاريخ النهاية ' + col(c.endDate) +
      ', الدور ' + col(c.role) + ', attendance-sheet ' + col(c.sheet) +
      ' — ' + eventsTable.events.length + ' events');
  } else {
    lines.push('📋 No events tab found — event details are read from each attendance tab (or its name).');
  }
  lines.push('');

  tabs.forEach(function (tab) {
    if (tab.skipReason) {
      lines.push('⏭  "' + tab.name + '" — skipped: ' + tab.skipReason);
      return;
    }
    if (eventsTable && tab === eventsTable.tab) return;
    if (!isCertificateSheet_(tab.name)) {
      lines.push('⏭  "' + tab.name + '" — skipped: name does not start with "' + CONFIG.CERTIFICATE_SHEET_PREFIXES.join('" / "') + '" → no certificates');
      return;
    }
    const layout = detectLayout_(tab.values);
    if (!layout.attendance) {
      lines.push('⚠️  "' + tab.name + '" — no attendance header found (needs a row with a name column AND a الرقم الجامعي column). Not searched.');
      return;
    }
    const a = layout.attendance;
    const e = resolveEvent_(tab.name, layout.event, eventsTable);
    const date = readDate_(e.date, timeZone);
    let rows = 0;
    for (let r = a.headerRow + 1; r < tab.values.length; r++) {
      if (!isBlank_(tab.values[r][a.nameCol]) && (a.attendedCol < 0 || isAttended_(tab.values[r][a.attendedCol]))) rows++;
    }
    lines.push('✅ "' + tab.name + '"');
    lines.push('     event details from: ' + (e.fromEventsTab ? 'events tab' : (eventsTable ? '⚠️ NO MATCHING ROW in events tab — using this tab' : 'this tab')));
    lines.push('     title:   ' + e.title);
    lines.push('     date:    ' + (date.iso || '(missing or unreadable: "' + date.raw + '")'));
    const endDate = readDate_(e.endDate, timeZone);
    if (!isBlank_(e.endDate)) lines.push('     end date: ' + (endDate.iso || '⚠️ unreadable: "' + endDate.raw + '"'));
    if (!isBlank_(e.role)) lines.push('     default role: ' + cellText_(e.role) + ' (used when a row has no role)');
    lines.push('     type:    ' + (cellText_(e.type) || '(missing)'));
    lines.push('     طريقة التنفيذ: ' + (cellText_(e.delivery) || '(none)'));
    lines.push('     الشطر:   ' + (a.sectionCol >= 0 ? 'per attendee, column ' + col(a.sectionCol) : (cellText_(e.section) || '(missing → masculine wording)')));
    lines.push('     header row ' + (a.headerRow + 1) + ' → name ' + col(a.nameCol) + ', الرقم الجامعي ' + col(a.idCol) +
      ', الشطر ' + col(a.sectionCol) + ', الدور ' + col(a.roleCol) + ', الأيام ' + col(a.daysCol) + ', attended ' + col(a.attendedCol));
    if (a.daysCol >= 0) {
      let unreadable = 0;
      for (let r = a.headerRow + 1; r < tab.values.length; r++) {
        const cell = tab.values[r][a.daysCol];
        if (!isBlank_(cell) && !readDays_(cell, timeZone).length) unreadable++;
      }
      if (unreadable) lines.push('     ⚠️ ' + unreadable + ' row(s) have الأيام with no readable date — write options like "الثلاثاء 11/11/2026"');
    }
    if (a.idCol < 0) lines.push('     ⚠️ no الرقم الجامعي column — this tab can only be matched by name');
    lines.push('     attendance rows counted: ' + rows);
  });

  console.log(lines.join('\n'));
}

/** Runs one lookup from the editor. Replace the placeholders with a real attendee, run, then revert. */
function testSearch() {
  const result = findCertificates_('PUT FULL NAME HERE', 'PUT STUDENT ID HERE');
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Creates a "_Event Template" tab showing the recommended layout. Because its
 * name starts with "_" it is ignored by the search. To add an event, duplicate
 * this tab, rename the copy to the event name, fill it in.
 */
function setupTemplateSheet() {
  const spreadsheet = getSpreadsheet_();
  const name = '_Event Template';
  let sheet = spreadsheet.getSheetByName(name);
  if (sheet) {
    console.log('"' + name + '" already exists — nothing changed.');
    return;
  }
  sheet = spreadsheet.insertSheet(name);
  sheet.setRightToLeft(true);

  sheet.getRange('A1:B4').setValues([
    ['عنوان الفعالية / Event Title', ''],
    ['تاريخ الفعالية / Event Date', ''],
    ['نوع الفعالية / Event Type', ''],
    ['الشطر / Section', ''],
  ]);
  sheet.getRange('A6:B6').setValues([['الاسم الكامل / Full Name', 'الرقم الجامعي / Student ID']]);

  sheet.getRange('B2').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('B3').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['ورشة', 'فعالية', 'مسابقة', 'هاكاثون', 'لقاء', 'جلسة حوارية'], true)
      .build()
  );
  sheet.getRange('B4').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['طلاب', 'طالبات'], true).build()
  );
  sheet.getRange('A1:A4').setFontWeight('bold').setBackground('#F3EBFD');
  sheet.getRange('A6:B6').setFontWeight('bold').setBackground('#7E36E3').setFontColor('#FFFFFF');
  sheet.setFrozenRows(6);
  sheet.setColumnWidths(1, 2, 260);
  console.log('Created "' + name + '".');
}

function columnLetter_(index) {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
