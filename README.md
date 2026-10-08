# AI Club Certificates — منصة إصدار شهادات نادي الذكاء الاصطناعي

Certificate issuance website for the **Artificial Intelligence Club — Faculty of Computing and Information Technology (FCIT), King Abdulaziz University**.

A participant enters their full name and email, the site checks the club's **attendance** records in Google Sheets, lists every event they attended, and generates the official certificate (3200×2262 template) as a **PDF** or **PNG** — entirely in the browser.

---

## Contents

1. [Project overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech stack](#3-tech-stack)
4. [Project structure](#4-project-structure)
5. [Install dependencies](#5-install-dependencies)
6. [Run locally](#6-run-locally)
7. [Environment variables](#7-environment-variables)
8. [Google Sheets structure](#8-google-sheets-structure)
9. [How the attendance search works](#9-how-the-attendance-search-works)
10. [Google Apps Script setup](#10-google-apps-script-setup)
11. [Deploy the Apps Script](#11-deploy-the-apps-script)
12. [Connect the frontend to the API](#12-connect-the-frontend-to-the-api)
13. [Add a new event](#13-add-a-new-event)
14. [How attendance data should be structured](#14-how-attendance-data-should-be-structured)
15. [How certificate generation works](#15-how-certificate-generation-works)
16. [Modify certificate settings](#16-modify-certificate-settings)
17. [Build the project](#17-build-the-project)
18. [Deploy the frontend](#18-deploy-the-frontend)
19. [Troubleshooting](#19-troubleshooting)
20. [Future development](#20-future-development)
- [Design decisions & assumptions](#design-decisions--assumptions)

---

## 1. Project overview

```
 Browser (React + Vite)                Google Apps Script (Web App)          Google Sheets (private)
 ────────────────────────              ────────────────────────────          ───────────────────────
 Name + Email form      ── POST ──▶    doPost()                               one tab per event:
                                       • scans every event tab        ──▶     • event info (title, date,
 Event list            ◀── JSON ──     • finds the attendance table             type, الشطر)
                                       • matches name AND email               • attendance table
 Certificate (canvas)                  • returns ONLY this person's             (Full Name, Email, …)
 → PDF / PNG download                    matches
```

- **Attendance is the only source of truth.** Registration data is never used. Tabs whose name looks like a registration tab are skipped automatically.
- The spreadsheet stays **private**. Only the Apps Script (running as the club account) can read it. The browser never sees the sheet ID, credentials, or anyone else's data.
- Certificates are drawn **in the browser** on top of the official template, so there is no server cost and no file storage.

## 2. Features

- Arabic, right-to-left interface following the AI Club designer guide (black / white / `#7E36E3` / `#54D640`) and the approved website palette (lavender, mint, off-white, slate).
- Verification by **full name + email** together (never email alone), tolerant of extra spaces, letter case in emails, and common Arabic letter variants.
- Handles every state: empty / invalid fields, loading, no attendance, one event (pre-selected), several events (choose one), generation, download, and API errors.
- Event cards show the event title, type, date and **الشطر**.
- Certificate generated at the template's full **3200×2262 px** resolution, with the exact text positions, sizes, weights and colours from the certificate specification.
- Certificate sentence chosen automatically from the event type and الشطر (طالبات → feminine, طلاب → masculine).
- Downloads: lossless **PNG** and a single-page **PDF** (A4-landscape, PNG embedded losslessly). File names like `AI-Club-Certificate-Reemas-Al-Sulami.pdf`.
- Mobile-first: large tap targets, 17px inputs (no iOS zoom), stacked actions, responsive preview.
- New events need **no code changes** — add a tab to the spreadsheet and it is searched automatically.
- Built-in **diagnose** tool in Apps Script that reports how each tab was understood, without printing student data.

## 3. Tech stack

| Part | Choice | Why |
|---|---|---|
| UI | React 19 + TypeScript | Typed, component-based, familiar to most student developers |
| Build | Vite 7 | Fast dev server, simple static build |
| Styling | Plain CSS + CSS Modules, design tokens in `src/styles/tokens.css` | No framework to learn; colours defined in one place |
| Certificate | HTML Canvas 2D | Draws text on the official PNG template at full resolution |
| PDF | [`pdf-lib`](https://pdf-lib.js.org/) (loaded only when a PDF is requested) | Embeds the PNG losslessly; small and dependency-free |
| API | Google Apps Script Web App | Free, lives next to the spreadsheet, keeps the sheet private |
| Data | Google Sheets | The club already manages attendance there |
| Fonts | Readex Pro (self-hosted, OFL) · Satoshi (Fontshare CDN) | Readex Pro is the certificate spec font; Satoshi is the guide's English wordmark font |

No other runtime dependencies. Icons are a small inline SVG set (`src/components/ui/Icon.tsx`).

## 4. Project structure

```
ai-club-certificates/
├── apps-script/                 Google Apps Script API (copy into the Apps Script editor)
│   ├── Config.gs                ← sheet layout settings: label names, ignored tabs
│   ├── Code.gs                  doPost/doGet, layout detection, matching
│   ├── AdminTools.gs            diagnose(), testSearch(), setupTemplateSheet()
│   └── appsscript.json          manifest (time zone, permissions, web-app access)
├── public/
│   └── favicon.png
├── src/
│   ├── main.tsx                 entry point (loads global styles)
│   ├── App.tsx                  header + page + footer
│   ├── pages/
│   │   └── CertificatePage.tsx  the whole flow: form → results → certificate
│   ├── hooks/
│   │   └── useCertificateFlow.ts  state machine for the flow (search, select, generate, download)
│   ├── components/
│   │   ├── layout/              SiteHeader, PageHero, SiteFooter
│   │   ├── flow/                StepIndicator, VerifyForm, EventResults, EventCard, CertificateResult
│   │   ├── brand/               ClubLogo, PixelCluster (pixel squares), Sparkle
│   │   └── ui/                  Button, TextField, Notice, Spinner, Icon
│   ├── certificate/
│   │   ├── certificateContent.ts  event type + الشطر → sentence; name/title/date text
│   │   ├── renderCertificate.ts   draws the certificate on a 3200×2262 canvas
│   │   ├── canvasText.ts          right-aligned RTL text, auto-shrink, wrapping, mixed styles
│   │   └── exportCertificate.ts   PNG/PDF export, file names, downloads
│   ├── services/
│   │   ├── attendanceApi.ts       calls the Apps Script API
│   │   ├── apiError.ts            typed API errors
│   │   └── mock/                  DEVELOPMENT-ONLY fictional data (see §6)
│   ├── config/
│   │   ├── certificate.ts         ← certificate positions, fonts, colours, sentences, type names
│   │   ├── site.ts                ← club name, hashtag, social links
│   │   └── env.ts                 reads VITE_* variables
│   ├── utils/                     normalize, validation, date (Arabic), text direction/file names
│   ├── types/index.ts             shared TypeScript types
│   ├── styles/                    tokens.css (colours), base.css, fonts.css
│   └── assets/
│       ├── certificate/certificate-template.png   official template (3200×2262)
│       ├── brand/                 logo marks from the designer guide
│       └── fonts/                 Readex Pro (variable, Arabic + Latin) + licence
├── .env.example                 copy to .env.local
├── .env.mock                    used by `npm run dev:mock`
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Files marked **←** are the ones you will most often edit.

## 5. Install dependencies

Requirements: **Node.js 20.19+ or 22.12+** (needed by Vite 7) and npm.

```bash
cd ai-club-certificates
npm install
```

Open the folder in Visual Studio Code: `code .`

## 6. Run locally

**Option A — with fictional data (no Google setup needed):**

```bash
npm run dev:mock
```

Open the printed URL (usually http://localhost:5173). Test inputs:

| Full name | Email | Result |
|---|---|---|
| ريم أحمد | reem@example.com | 2 events (طالبات) |
| Omar Khalid | omar@example.com | 1 event (طلاب, very long title) |
| anything | error@example.com | simulated server error |
| anything else | — | "no attendance found" |

The mock lives in `src/services/mock/` and is only loaded when `VITE_USE_MOCK_API=true`; it is never included in a normal build.

**Option B — with the real spreadsheet:** finish §10–§12 first, then:

```bash
cp .env.example .env.local     # then paste your Web App URL into it
npm run dev
```

## 7. Environment variables

Set in `.env.local` (local) or in your hosting provider's settings (production). Vite embeds them **at build time**, so rebuild after changing them.

| Variable | Required | Description |
|---|---|---|
| `VITE_ATTENDANCE_API_URL` | Yes (production) | The Apps Script Web App URL, ending in `/exec`. |
| `VITE_USE_MOCK_API` | No | `true` = use fictional data. Leave `false`/unset in production. |

> The Web App URL is **not a secret** — any browser that uses the site can see it. Security comes from the script: it only answers "which events did *this* name + email attend", never returns lists, and the spreadsheet itself is private. Never put the spreadsheet ID, service-account keys or any password in a `VITE_*` variable.

## 8. Google Sheets structure

**One tab (worksheet) per event.** Each event tab contains:

**A) Event information** — a label cell followed by its value:

| Field | Accepted labels (any one; English or Arabic; bilingual like `Section / الشطر` works) |
|---|---|
| Title | `Event Title`, `Event Name`, `Title`, `عنوان الفعالية`, `اسم الفعالية`, `العنوان` … |
| Date | `Event Date`, `Date`, `تاريخ الفعالية`, `التاريخ` |
| Type | `Event Type`, `Type`, `نوع الفعالية`, `النوع` |
| الشطر | `Section`, `الشطر` |

The value can be **to the right** of the label, **below** it (labels as a header row), or in the **same cell** after a colon (`Event Title: Generative AI`).

**B) Attendance table** — a header row that contains **both** a name column and an email column, with one attendee per row underneath:

| Column | Accepted headers | Required |
|---|---|---|
| Full name | `Full Name`, `Name`, `الاسم الكامل`, `الاسم`, `الاسم الثلاثي` … | Yes |
| Email | `Email`, `E-mail`, `البريد الإلكتروني`, `الإيميل` … | Yes |
| الشطر | `Section`, `الشطر` | Optional — overrides the event-level الشطر for that row |
| Attendance status | `Attended`, `Attendance`, `الحضور`, `حاضر` … | Optional — if present, only rows marked attended count (`TRUE` checkbox, `نعم`, `Yes`, `حاضر`, `✓` …) |

**Recommended layout** (this is what `setupTemplateSheet()` creates):

|   | A | B |
|---|---|---|
| 1 | عنوان الفعالية / Event Title | مقدمة في الذكاء الاصطناعي |
| 2 | تاريخ الفعالية / Event Date | 2026-10-07 |
| 3 | نوع الفعالية / Event Type | ورشة |
| 4 | الشطر / Section | طالبات |
| 5 | | |
| 6 | **الاسم الكامل / Full Name** | **البريد الإلكتروني / Email** |
| 7 | … | … |

All label lists live in `apps-script/Config.gs`. If your sheet uses different wording, add the wording there — no other change needed.

**Tabs that are ignored:**
- names starting with `_` (e.g. `_Event Template`, `_Notes`)
- names listed in `IGNORED_SHEETS`
- names containing a registration keyword (`registration`, `تسجيل`, `التسجيل`, `المسجلين`) — so a registration list can never produce a certificate
- tabs without an attendance header row (they are simply not event tabs)

## 9. How the attendance search works

1. The browser sends `{ action, fullName, email }` to the Web App (as `text/plain` JSON, which avoids a CORS pre-flight).
2. The script validates the input (both required, sane length, email format).
3. For **every** tab not ignored (§8), it:
   - finds the attendance header row (first row with a name column and an email column);
   - reads the event information from the rest of the tab (never from inside the attendance table);
   - looks for a row where **email matches AND name matches** (and, if a status column exists, the row is marked attended).
4. It returns one entry per matching event: `eventId, title, type, section, date, dateRaw, participantName`, newest first. Nothing else from the sheet is returned.

**Normalisation before comparing** (same rules in `Code.gs → normalizeName_` and `src/utils/normalize.ts`):

- trim, collapse repeated spaces, ignore invisible direction marks;
- emails: remove all spaces, lower-case;
- names: case-insensitive (for Latin names), Arabic diacritics and tatweel removed, `أ/إ/آ → ا`, `ة → ه`, `ى → ي`.

So `"  سارة   أحمد "` matches `"ساره احمد"`, but `"سارة محمد"` never matches `"سارة أحمد"` — the whole name must be the same.

The certificate prints the name **as written in the attendance sheet** (the official spelling), not the participant's typing.

**Dates:** real date cells are read in the spreadsheet's time zone. Text dates are accepted as `yyyy-mm-dd`, `yyyy/mm/dd`, `dd-mm-yyyy` or `dd/mm/yyyy` (day first, as used in Saudi Arabia), with English or Arabic-Indic digits.

## 10. Google Apps Script setup

Use a club-owned Google account that has access to the spreadsheet.

1. Open the spreadsheet → **Extensions → Apps Script**. (This makes a script *bound* to the sheet — recommended.)
2. Delete the default `Code.gs` content. Create three script files and paste the contents of:
   - `apps-script/Config.gs`
   - `apps-script/Code.gs`
   - `apps-script/AdminTools.gs`
3. Show the manifest: **Project Settings (⚙) → "Show 'appsscript.json' manifest file in editor"**, then replace its content with `apps-script/appsscript.json`.
4. Check the layout: choose `diagnose` in the toolbar function list → **Run**. Approve the permission prompt the first time. Open **Execution log**: every tab is listed with ✅ (searched), ⏭ (skipped) or ⚠️ (no attendance table). Fix any ⚠️ by adjusting labels in the sheet or aliases in `Config.gs`.
5. Optional: run `setupTemplateSheet` to create an `_Event Template` tab.
6. Optional: put a real attendee in `testSearch()`, run it, check the log, then put the placeholders back.

> **Standalone script instead of bound?** Set `CONFIG.SPREADSHEET_ID` to the ID from the sheet URL and change the scope in `appsscript.json` to `https://www.googleapis.com/auth/spreadsheets.readonly` (`setupTemplateSheet` then needs `.../auth/spreadsheets`).

## 11. Deploy the Apps Script

1. In the Apps Script editor: **Deploy → New deployment**.
2. Type: **Web app**.
3. **Execute as: Me** (the club account) — so the sheet can stay private.
4. **Who has access: Anyone** — students are not signed in to Google. (The manifest already says this.)
5. **Deploy**, approve permissions, copy the **Web app URL** (ends with `/exec`).
6. Test: open the URL in a browser. You should see `{"ok":true,"data":{"service":"ai-club-certificates","status":"running"}}`.

**After editing the script** you must publish a new version: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The URL stays the same. (Saving alone does not update the live Web App.)

## 12. Connect the frontend to the API

1. `cp .env.example .env.local`
2. Set `VITE_ATTENDANCE_API_URL=https://script.google.com/macros/s/…/exec`
3. Make sure `VITE_USE_MOCK_API=false` (or remove the line).
4. `npm run dev` and try a real attendee.

In production set the same variable in your hosting dashboard (§18) and rebuild.

## 13. Add a new event

No code changes, no redeploy:

1. Duplicate `_Event Template` (or any existing event tab) and **rename** the copy to the event name (must **not** start with `_` or contain "registration/تسجيل").
2. Fill in **title, date, type, الشطر**.
3. Paste the **attendance** list (full name + email) under the header row. Only people who actually attended.
4. Optional: run `diagnose` to confirm the tab shows ✅.

The next search automatically includes the new tab.

Event **type** values that get their own certificate sentence: `ورشة` / Workshop, `فعالية` / Event, `مسابقة` / Competition, `هاكاثون` / Hackathon, `لقاء` / Meetup, `جلسة حوارية` / Panel. Anything else uses the general "فعالية" sentence — add new spellings in `src/config/certificate.ts → eventTypeAliases`.

## 14. How attendance data should be structured

- One person per row; **full name** and **email** in their own columns.
- Use the name exactly as it should appear on the certificate (spelling, order). It is printed as-is.
- Use the email the student will type. Case and stray spaces do not matter.
- Do not mix registrations into the attendance table. If you keep registrations in the same tab, use an **attendance status** column (`الحضور` with checkboxes) — then only ticked rows count.
- Keep a separate registration tab if you like, but give it a name containing `تسجيل`/`registration` or starting with `_`.
- الشطر: `طالبات` or `طلاب`. Put it once in the event info, or per row in a `الشطر` column (row value wins).
- Dates: preferably a real date cell (Format → Number → Date), or text `2026-10-07` / `07-10-2026`.
- Duplicate rows are harmless — each event is returned once.

## 15. How certificate generation works

`src/certificate/renderCertificate.ts`:

1. Loads the official template `src/assets/certificate/certificate-template.png` (3200×2262, extracted from the provided certificate specification).
2. Waits for the **Readex Pro** weights (400/500/700) to load — self-hosted, so it never depends on a CDN at render time.
3. Draws four right-aligned, RTL text fields; `y` is the vertical **centre** of the text; the right edge is 344 px from the template's right edge:

| Field | y | Size | Weight | Colour |
|---|---|---|---|---|
| Name | 922 | 152 px (shrinks to ≥ 96 px if wider than 2500 px) | Bold 700 | `#1a1624` |
| Sentence | 1157 | 68 px | Regular 400 | `#1a1624` |
| Title | 1307 | 104 px → shrinks to 60 px if wider than 2500 px; wraps to more lines if still too wide | Medium 500; text before `:` is Bold 700 `#5a20b5` | `#1a1624` |
| Date | 1477 | 68 px | Regular 400 | `#1a1624` |

4. **Sentence** = event type × gender from الشطر (spec table):

| Type | طلاب | طالبات |
|---|---|---|
| ورشة | قد حضر ورشة عمل بعنوان | قد حضرت ورشة عمل بعنوان |
| فعالية | قد حضر فعالية بعنوان | قد حضرت فعالية بعنوان |
| مسابقة | قد شارك في مسابقة بعنوان | قد شاركت في مسابقة بعنوان |
| هاكاثون | قد شارك في هاكاثون بعنوان | قد شاركت في هاكاثون بعنوان |
| لقاء | قد حضر لقاء بعنوان | قد حضرت لقاء بعنوان |
| جلسة حوارية | قد حضر جلسة حوارية بعنوان | قد حضرت جلسة حوارية بعنوان |

5. **Date line**: `2026-05-03` → `وذلك يوم الأحد الموافق 3 مايو 2026` — weekday calculated automatically, English digits (spec).
6. **Export** (`exportCertificate.ts`): PNG via `canvas.toBlob` (lossless, 3200×2262). PDF via `pdf-lib`: one page 841.89 × 595.11 pt (A4 landscape width, template aspect ratio) with the PNG embedded losslessly.

Mixed Arabic/English titles keep correct reading order: the text direction is taken from the first letter of the title.

## 16. Modify certificate settings

Everything is in **`src/config/certificate.ts`**:

- **New template design** (same size): replace `src/assets/certificate/certificate-template.png`. Different size: also change `width`/`height`.
- **Text positions / sizes / weights / colours**: `fields`, `rightMargin`, `maxTextWidth`, `colors`.
- **Sentences**: `certificateSentences`.
- **Event type spellings**: `eventTypeAliases` (and the card label in `eventTypeLabels`).
- **الشطر keywords / default gender**: `sectionGenderKeywords`, `fallbackGender` (used when الشطر is empty).
- **File name prefix**: `fileNamePrefix`.
- **PDF page size / author**: `pdf`.
- **Font**: replace `src/assets/fonts/…` and `src/styles/fonts.css`, then set `fontFamily`.

Website colours are in `src/styles/tokens.css`; club text and social links in `src/config/site.ts` (add the LinkedIn URL there — it is shown without a link until then).

## 17. Build the project

```bash
npm run typecheck   # TypeScript check only
npm run build       # type-check + production build into dist/
npm run preview     # serve dist/ locally to test the build
```

`dist/` is a fully static site.

## 18. Deploy the frontend

Any static host works. Remember: **set `VITE_ATTENDANCE_API_URL` in the host's environment settings before building.**

- **Netlify:** New site → import the repo → Build command `npm run build`, Publish directory `dist` → Site settings → Environment variables → add `VITE_ATTENDANCE_API_URL` → redeploy.
- **Vercel:** Import project → Framework "Vite" → add the environment variable → Deploy.
- **GitHub Pages:** build locally with `.env.production` containing the URL (`npm run build`) and publish `dist/` (e.g. with the `gh-pages` package or a GitHub Action). `vite.config.ts` uses `base: './'`, so the site works from a sub-folder.
- **University server:** upload the contents of `dist/` to any web folder.

## 19. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "خدمة الشهادات غير متاحة حاليًا" | `VITE_ATTENDANCE_API_URL` is empty in that build. Set it and rebuild. (Browser console shows a hint.) |
| "تعذّر الاتصال بالخادم" | Wrong URL, the deployment was deleted, or "Who has access" is not **Anyone**. Open the URL in a private window — you should see the health-check JSON. |
| A real attendee gets "no attendance found" | Run `diagnose`: is the tab ✅? Is the person in the *attendance* table (not registration)? Same email? Name spelled the same (letters, order)? If there is a status column, is the row marked attended? |
| An event tab is ⚠️ in `diagnose` | No row has both a name header and an email header. Rename headers or add your wording to `ATTENDANCE_COLUMN_LABELS` in `Config.gs`, then **deploy a new version**. |
| Wrong title/date/type on the card | Run `diagnose` to see what was read. The label wording may not be in `EVENT_FIELD_LABELS`. |
| Date shows as raw text | The cell is text in an unrecognised format. Use a real date cell or `yyyy-mm-dd`. |
| Script changes don't take effect | You must publish a **new version** of the deployment (§11). |
| Wrong verb (حضر/حضرت) | Check الشطر says `طالبات`/`طلاب`. Empty → `fallbackGender`. |
| Wrong sentence type | Add the sheet's wording to `eventTypeAliases`. |
| Name/title looks too small | Long text auto-shrinks to stay inside 2500 px (spec). |
| Download does nothing on iPhone | Use Safari 15+; in some in-app browsers (Instagram, X) downloads are blocked — open the site in Safari/Chrome. |
| `npm install` fails | Check Node version (`node -v` ≥ 20.19). |

## 20. Future development

- **Verification link / QR code** on each certificate (add a `certificateId` column, a `verify` action in Apps Script, and a `/verify` page).
- **Rate limiting** in Apps Script using `CacheService` (e.g. max N lookups per email per 10 minutes).
- **Caching** the parsed tabs in `CacheService` if the spreadsheet grows to many large tabs.
- **Email delivery** of the certificate with `MailApp` after generation.
- **English certificate variant**: a second template + config entry selected by a column in the sheet.
- **Admin dashboard**: counts of certificates issued per event (log requests to a hidden `_Log` tab — without storing more personal data than needed).
- **Unit tests** with Vitest for `src/utils` and `src/certificate/certificateContent.ts`.

---

## Design decisions & assumptions

These were chosen because the source files did not fully specify them. Each is easy to change.

- **The spreadsheet was private when this was built**, so its exact layout could not be inspected. The script therefore **detects** the layout by label names (§8) instead of fixed cell addresses, and `diagnose()` shows what it found. If your labels differ, add them to `Config.gs`.
- **"الشطر" not "الفرع".** The certificate spec says the gender comes from "الفرع"; per the project requirements this is the **الشطر** field everywhere (UI, data model, Apps Script).
- **Certificate name spelling** comes from the attendance sheet, not from what the student typed.
- **Unknown event type** → "فعالية" sentence. **Empty/unknown الشطر** → masculine form (`fallbackGender`).
- **Over-long names** shrink (min 96 px) and **over-long titles** wrap after shrinking to 60 px — the spec only defines shrinking for the title.
- **Text dates are day-first** (`07-10-2026` = 7 October).
- **Error styling without red:** the approved palette has no red, so errors use the deep certificate purple `#5A20B5`, a thicker border, a tinted field and an alert icon.
- **Fonts:** the certificate spec requires **Readex Pro**, used for the certificate and the site (self-hosted, SIL OFL licence included). The designer guide's English wordmark font **Satoshi** loads from Fontshare. The guide's Arabic display font ("The Year of Handicrafts") is not bundled; to use it for headings, add its web font files to `src/assets/fonts/`, declare it in `src/styles/fonts.css`, and put it first in a heading font stack.
- **Header layout** mirrors the designer-guide cover: faculty (FCIT) logo on the right, AIClub mark + wordmark on the left, on black, with the guide's purple title bar, green sparkle and pixel squares; the content area uses the website palette (off-white base with lavender and mint edge glows); the footer ends with the guide's white `#نقود_المستقبل` strip.
- **Brand assets** (template, logo marks, FCIT logo) were extracted from the provided PDFs. For best print quality, replace them with the original master files from the designer if available (same file names).
