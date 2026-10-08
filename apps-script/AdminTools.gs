/**
 * Admin helpers — run these manually from the Apps Script editor
 * (select the function in the toolbar, then click "Run"). They are NOT
 * reachable from the website.
 */

/**
 * Prints what the API detects on every tab: event info, attendance columns and
 * the NUMBER of attendance rows. It never prints student names or emails.
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
      ', الشطر ' + col(c.section) + ', attendance-sheet ' + col(c.sheet) +
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
    const layout = detectLayout_(tab.values);
    if (!layout.attendance) {
      lines.push('⚠️  "' + tab.name + '" — no attendance header found (needs a row with a name column AND an email column). Not searched.');
      return;
    }
    const a = layout.attendance;
    const e = resolveEvent_(tab.name, layout.event, eventsTable);
    const date = readDate_(e.date, timeZone);
    let rows = 0;
    for (let r = a.headerRow + 1; r < tab.values.length; r++) {
      if (!isBlank_(tab.values[r][a.emailCol]) && (a.attendedCol < 0 || isAttended_(tab.values[r][a.attendedCol]))) rows++;
    }
    lines.push('✅ "' + tab.name + '"');
    lines.push('     event details from: ' + (e.fromEventsTab ? 'events tab' : (eventsTable ? '⚠️ NO MATCHING ROW in events tab — using this tab' : 'this tab')));
    lines.push('     title:   ' + e.title);
    lines.push('     date:    ' + (date.iso || '(missing or unreadable: "' + date.raw + '")'));
    lines.push('     type:    ' + (cellText_(e.type) || '(missing)'));
    lines.push('     الشطر:   ' + (a.sectionCol >= 0 ? 'per attendee, column ' + col(a.sectionCol) : (cellText_(e.section) || '(missing → masculine wording)')));
    lines.push('     header row ' + (a.headerRow + 1) + ' → name ' + col(a.nameCol) + ', email ' + col(a.emailCol) +
      ', الشطر ' + col(a.sectionCol) + ', attended ' + col(a.attendedCol));
    lines.push('     attendance rows counted: ' + rows);
  });

  console.log(lines.join('\n'));
}

/** Runs one lookup from the editor. Replace the placeholders with a real attendee, run, then revert. */
function testSearch() {
  const result = findCertificates_('PUT FULL NAME HERE', 'put-email@here.com');
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
  sheet.getRange('A6:B6').setValues([['الاسم الكامل / Full Name', 'البريد الإلكتروني / Email']]);

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