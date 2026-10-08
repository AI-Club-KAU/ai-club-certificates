/**
 * AI Club Certificates — attendance lookup API (Google Apps Script Web App).
 *
 * POST body (JSON, sent as text/plain to avoid a CORS preflight):
 *   { "action": "findCertificates", "fullName": "...", "email": "..." }
 *
 * Success:  { "ok": true, "data": { "matches": [ EventMatch, ... ] } }
 * Failure:  { "ok": false, "error": { "code": "...", "message": "..." } }
 *
 * EventMatch = {
 *   eventId, title, type, section,
 *   date      // "yyyy-MM-dd" when the sheet date could be read, otherwise null
 *   dateRaw   // the date exactly as written in the sheet (fallback for display)
 *   participantName // the name as recorded in the attendance sheet
 * }
 *
 * Only the requesting participant's own matches are ever returned.
 * Layout settings live in Config.gs.
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
    const email = String(body.email || '');
    const inputError = validateInput_(fullName, email);
    if (inputError) {
      return json_({ ok: false, error: { code: 'INVALID_INPUT', message: inputError } });
    }

    const matches = findCertificates_(fullName, email);
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
 * Searches every attendance tab for a row whose name AND email both match.
 * Event details come from the events tab (one row per event) when it exists,
 * otherwise from labelled cells inside the attendance tab, otherwise the tab name.
 */
function findCertificates_(fullName, email) {
  const wantedName = normalizeName_(fullName);
  const wantedEmail = normalizeEmail_(email);
  const spreadsheet = getSpreadsheet_();
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  const tabs = readTabs_(spreadsheet);
  const eventsTable = findEventsTable_(tabs);
  const matches = [];

  tabs.forEach(function (tab) {
    if (tab.skipReason || (eventsTable && tab === eventsTable.tab)) return;
    const layout = detectLayout_(tab.values);
    if (!layout.attendance) return; // not an attendance tab

    const record = findAttendanceRow_(tab.values, layout.attendance, wantedName, wantedEmail);
    if (!record) return;

    const event = resolveEvent_(tab.name, layout.event, eventsTable);
    const rowSection = layout.attendance.sectionCol >= 0 ? cellText_(record[layout.attendance.sectionCol]) : '';
    const date = readDate_(event.date, timeZone);

    matches.push({
      eventId: String(tab.sheet.getSheetId()),
      title: cellText_(event.title),
      type: cellText_(event.type),
      section: rowSection || cellText_(event.section),
      date: date.iso,
      dateRaw: date.raw,
      participantName: collapseSpaces_(cellText_(record[layout.attendance.nameCol])),
    });
  });

  // Newest events first; undated events last.
  matches.sort(function (a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
  return matches;
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
    fromEventsTab: Boolean(row.title),
  };
}

/** "حضور - Introduction to AI" → "Introduction to AI" (see CONFIG.TITLE_PREFIXES_TO_STRIP). */
function titleFromSheetName_(name) {
  let title = String(name).trim();
  CONFIG.TITLE_PREFIXES_TO_STRIP.forEach(function (prefix) {
    const pattern = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[-–—:|]\\s*', 'i');
    title = title.replace(pattern, '');
  });
  return title.trim() || String(name).trim();
}

function findAttendanceRow_(values, attendance, wantedName, wantedEmail) {
  for (let r = attendance.headerRow + 1; r < values.length; r++) {
    const row = values[r];
    if (normalizeEmail_(cellText_(row[attendance.emailCol])) !== wantedEmail) continue;
    if (normalizeName_(cellText_(row[attendance.nameCol])) !== wantedName) continue;
    if (attendance.attendedCol >= 0 && !isAttended_(row[attendance.attendedCol])) continue;
    return row;
  }
  return null;
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
 * Returns { attendance: null | {...}, event: { title, date, type, section } }.
 */
function detectLayout_(values) {
  const attendance = detectAttendanceHeader_(values);
  const event = { title: '', date: '', type: '', section: '' };
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
    const emailCol = findColumn_(row, labels.email);
    if (nameCol < 0 || emailCol < 0) continue;

    const sectionCol = findColumn_(row, labels.section);
    const attendedCol = findColumn_(row, labels.attended);
    const cols = [nameCol, emailCol, sectionCol, attendedCol].filter(function (c) { return c >= 0; });
    return {
      headerRow: r,
      nameCol: nameCol,
      emailCol: emailCol,
      sectionCol: sectionCol,
      attendedCol: attendedCol,
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
 */
function normalizeName_(value) {
  return collapseSpaces_(
    String(value || '')
      .normalize('NFKC')
      .replace(/[​-‏‪-‮⁦-⁩﻿]/g, '')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase()
  );
}

function normalizeEmail_(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\s​-‏﻿]/g, '')
    .toLowerCase();
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

function validateInput_(fullName, email) {
  const name = collapseSpaces_(fullName);
  const mail = normalizeEmail_(email);
  if (!name || !mail) return 'Full name and email are required.';
  if (name.length > CONFIG.MAX_NAME_LENGTH || mail.length > CONFIG.MAX_EMAIL_LENGTH) return 'Input is too long.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return 'Email address is not valid.';
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