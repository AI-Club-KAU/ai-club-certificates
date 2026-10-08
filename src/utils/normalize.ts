/**
 * Text normalisation shared by validation, type matching and file names.
 * `normalizeForMatch` mirrors `normalizeName_` in apps-script/Code.gs —
 * keep the two in sync if you change either.
 */

const INVISIBLE_CHARS = /[​-‏‪-‮⁦-⁩﻿]/g;
const ARABIC_DIACRITICS_AND_TATWEEL = /[ً-ٰٟـ]/g;

/** Trims and collapses runs of whitespace into single spaces. */
export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Comparison key: case-insensitive, spacing-insensitive, Arabic letter variants unified. */
export function normalizeForMatch(value: string): string {
  return collapseSpaces(
    value
      .normalize('NFKC')
      .replace(INVISIBLE_CHARS, '')
      .replace(ARABIC_DIACRITICS_AND_TATWEEL, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase(),
  );
}

export function normalizeEmail(value: string): string {
  return value.normalize('NFKC').replace(/[\s​-‏﻿]/g, '').toLowerCase();
}

/** Clean display version of a typed name (keeps original letters, fixes spacing). */
export function cleanName(value: string): string {
  return collapseSpaces(value.normalize('NFKC').replace(INVISIBLE_CHARS, ''));
}
