import {
  defaultRoleByEventType,
  deliveryPhrases,
  eventTypeAliases,
  eventTypeLabels,
  eventTypeNouns,
  fallbackEventType,
  fallbackGender,
  sectionGenderKeywords,
} from '../config/certificate';
import { roles, type RoleDefinition } from '../config/roles';
import type { CertificateContent, EventMatch, EventTypeKey, Gender } from '../types';
import { formatCertificateDateLine } from '../utils/date';
import { cleanName, normalizeForMatch } from '../utils/normalize';

/** Maps the sheet's free-text event type ("ورشة", "Workshop", …) to a known type. */
export function resolveEventType(rawType: string): EventTypeKey | null {
  const value = normalizeForMatch(rawType);
  if (!value) return null;
  const keys = Object.keys(eventTypeAliases) as EventTypeKey[];
  return keys.find((key) => eventTypeAliases[key].some((alias) => normalizeForMatch(alias) === value)) ?? null;
}

/** Label for the website's event card; falls back to the sheet's own wording. */
export function getEventTypeLabel(rawType: string): string {
  const key = resolveEventType(rawType);
  return key ? eventTypeLabels[key] : rawType.trim();
}

/** الشطر → gender for the certificate sentence (طالبات → female, طلاب → male). */
export function resolveGender(section: string): Gender {
  const value = normalizeForMatch(section);
  const female = sectionGenderKeywords.female.some((k) => value.includes(normalizeForMatch(k)));
  if (female) return 'female';
  const male = sectionGenderKeywords.male.some((k) => value.includes(normalizeForMatch(k)));
  return male ? 'male' : fallbackGender;
}

/** Maps the sheet's role ("مشاركة", "تنظيم", …) to a role definition, or null if unknown. */
export function resolveRole(rawRole: string): RoleDefinition | null {
  const value = normalizeForMatch(rawRole);
  if (!value) return null;
  return roles.find((role) => role.labels.some((label) => normalizeForMatch(label) === value)) ?? null;
}

/** Role name for the website's event card ("مشاركة"), or '' when the sheet has no role. */
export function getRoleLabel(rawRole: string): string {
  const role = resolveRole(rawRole);
  return role ? role.labels[0] : rawRole.trim();
}

/** طريقة التنفيذ → printed wording ("عن بعد" → "عن بُعد"); unknown values are kept as written. */
export function getDeliveryText(rawDelivery: string): string {
  const value = normalizeForMatch(rawDelivery);
  if (!value) return '';
  const known = deliveryPhrases.find((d) => d.labels.some((label) => normalizeForMatch(label) === value));
  return known ? known.text : rawDelivery.replace(/\s+/g, ' ').trim();
}

/**
 * "قد" + verb (by الشطر) + words after the verb + event-type noun + طريقة التنفيذ + "بعنوان".
 * e.g. طالبات + مشاركة + ورشة + عن بعد → "قد شاركت في ورشة عمل عن بُعد بعنوان".
 */
export function buildSentence(rawRole: string, rawType: string, section: string, rawDelivery = ''): string {
  const type = resolveEventType(rawType) ?? fallbackEventType;
  const role =
    resolveRole(rawRole) ?? roles.find((r) => r.key === defaultRoleByEventType[type]) ?? roles[0];
  if (rawRole.trim() && !resolveRole(rawRole)) {
    console.warn(`[AI Club] Unknown role "${rawRole}" — using "${role.labels[0]}". Add it to src/config/roles.ts.`);
  }

  const verb = resolveGender(section) === 'female' ? role.female : role.male;
  const noun = eventTypeNouns[type];
  const after = role.after.trim();
  // "لـ" attaches to the noun: "خطّطت لورشة عمل".
  const object = after.endsWith('ـ') ? `${after.slice(0, -1)}${noun}` : [after, noun].filter(Boolean).join(' ');
  const delivery = getDeliveryText(rawDelivery);
  return `قد ${verb} ${[object, delivery].filter(Boolean).join(' ')} بعنوان`;
}

/** Builds the four dynamic certificate fields for one participant and event. */
export function buildCertificateContent(match: EventMatch, typedName: string): CertificateContent {
  return {
    // The attendance record's spelling is the official one; the typed name is only a fallback.
    name: cleanName(match.participantName || typedName),
    sentence: buildSentence(match.role, match.type, match.section, match.delivery),
    title: cleanName(match.title),
    dateLine: formatCertificateDateLine(match.date, match.dateRaw),
  };
}