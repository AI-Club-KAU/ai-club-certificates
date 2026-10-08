export type TextDirection = 'rtl' | 'ltr';

const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR_CHAR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;

/** Direction of a string, decided by its first strong (letter) character. Defaults to RTL. */
export function detectDirection(text: string, fallback: TextDirection = 'rtl'): TextDirection {
  for (const char of text) {
    if (RTL_CHAR.test(char)) return 'rtl';
    if (LTR_CHAR.test(char)) return 'ltr';
  }
  return fallback;
}

/**
 * Safe file-name segment that keeps Arabic and Latin letters:
 * "Reemas  Al-Sulami" → "Reemas-Al-Sulami".
 */
export function toFileNameSegment(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\p{M}ـ]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
