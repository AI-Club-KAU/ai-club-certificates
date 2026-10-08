import { cleanName, normalizeEmail } from './normalize';

export interface FieldErrors {
  fullName?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;

/** Validates the verification form. Returns an empty object when everything is valid. */
export function validateParticipant(fullName: string, email: string): FieldErrors {
  const errors: FieldErrors = {};
  const name = cleanName(fullName);
  const mail = normalizeEmail(email);

  if (!name) errors.fullName = 'أدخل اسمك الكامل.';
  else if (name.length < 3) errors.fullName = 'الاسم قصير جدًا، أدخل اسمك الكامل.';
  else if (name.length > MAX_NAME_LENGTH) errors.fullName = 'الاسم أطول من المسموح.';

  if (!mail) errors.email = 'أدخل بريدك الإلكتروني.';
  else if (mail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(mail)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
