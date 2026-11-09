/**
 * University ID helpers. Participants identify themselves with their name and
 * الرقم الجامعي; the same rules are applied by the Apps Script (normalizeStudentId_).
 */

/** "٢٢١٠٠٤٥", " 2210045 ", "2210-045" → "2210045" (Arabic digits and separators ignored). */
export function normalizeStudentId(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^0-9]/g, '');
}

/** Error message for the form, or null when the ID looks valid. */
export function validateStudentId(value: string): string | null {
  const id = normalizeStudentId(value);
  if (!id) return 'الرجاء إدخال الرقم الجامعي.';
  if (/[^\s0-9٠-٩۰-۹-]/.test(value)) return 'الرقم الجامعي يتكون من أرقام فقط.';
  if (id.length < 5 || id.length > 12) return 'تأكد من الرقم الجامعي.';
  return null;
}
