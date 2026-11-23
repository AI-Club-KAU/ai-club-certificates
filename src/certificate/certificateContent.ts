import {
  certificateKinds,
  defaultRoleByEventType,
  deliveryPhrases,
  eventTypeAliases,
  eventTypeLabels,
  eventTypeNouns,
  fallbackEventType,
  fallbackGender,
  sectionGenderKeywords,
  thanksLead,
} from '../config/certificate';
import { roles, type RoleDefinition } from '../config/roles';
import type { CertificateContent, CertificateKind, EventMatch, EventTypeKey, Gender } from '../types';
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
 * The role used for the certificate: the sheet's role, or — when it is empty or unknown —
 * the default for the event type (attendance, or participation for competitions/hackathons).
 */
export function effectiveRole(rawRole: string, rawType: string): RoleDefinition {
  const type = resolveEventType(rawType) ?? fallbackEventType;
  const known = resolveRole(rawRole);
  const role = known ?? roles.find((r) => r.key === defaultRoleByEventType[type]) ?? roles[0];
  if (rawRole.trim() && !known) {
    console.warn(`[AI Club] Unknown role "${rawRole}" — using "${role.labels[0]}". Add it to src/config/roles.ts.`);
  }
  return role;
}

/** Which certificate the participant gets: حضور / مشاركة / شكر وتقدير. */
export function getCertificateKind(rawRole: string, rawType: string): CertificateKind {
  return effectiveRole(rawRole, rawType).kind;
}

/** "words" + noun, where words ending in "لـ" attach to the noun: "لـ" + "ورشة عمل" → "لورشة عمل". */
function joinBeforeNoun(words: string, noun: string): string {
  const w = words.trim();
  return w.endsWith('ـ') ? `${w.slice(0, -1)}${noun}` : [w, noun].filter(Boolean).join(' ');
}

/**
 * The sentence under the name.
 *   attendance / participation: "قد" + verb (by الشطر) + words after the verb + type + delivery + "بعنوان"
 *     e.g. طالبات + مشاركة + ورشة + عن بعد → "قد شاركت في ورشة عمل عن بُعد بعنوان"
 *   thanks: "تقديرًا لجهوده/لجهودها في" + the role's thanks words + type + delivery + "بعنوان"
 *     e.g. طالبات + تمثيل + فعالية → "تقديرًا لجهودها في تمثيل النادي في فعالية بعنوان"
 */
export function buildSentence(rawRole: string, rawType: string, section: string, rawDelivery = ''): string {
  const type = resolveEventType(rawType) ?? fallbackEventType;
  const role = effectiveRole(rawRole, rawType);
  const gender = resolveGender(section);
  const noun = eventTypeNouns[type];
  const delivery = getDeliveryText(rawDelivery);

  if (role.kind === 'thanks') {
    const object = joinBeforeNoun(role.thanks ?? role.labels[0], noun);
    return `${thanksLead[gender]} ${[object, delivery].filter(Boolean).join(' ')} بعنوان`;
  }
  const verb = gender === 'female' ? role.female : role.male;
  const object = joinBeforeNoun(role.after, noun);
  return `قد ${verb} ${[object, delivery].filter(Boolean).join(' ')} بعنوان`;
}

/** Builds the dynamic certificate fields for one participant and event. */
export function buildCertificateContent(match: EventMatch, typedName: string): CertificateContent {
  const kind = getCertificateKind(match.role, match.type);
  return {
    kind,
    heading: certificateKinds[kind].heading,
    opening: certificateKinds[kind].opening,
    // The attendance record's spelling is the official one; the typed name is only a fallback.
    name: cleanName(match.participantName || typedName),
    sentence: buildSentence(match.role, match.type, match.section, match.delivery),
    title: cleanName(match.title),
    dateLine: formatCertificateDateLine(match.date, match.dateRaw, match.endDate ?? null, match.days ?? []),
  };
}