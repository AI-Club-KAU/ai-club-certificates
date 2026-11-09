import { useState, type FormEvent } from 'react';
import type { ParticipantQuery } from '../../types';
import { normalizeStudentId, validateStudentId } from '../../utils/studentId';
import { validateParticipant } from '../../utils/validation';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import styles from './VerifyForm.module.css';

interface VerifyFormProps {
  /** Current values; kept by the page so they survive moving between pages. */
  values: ParticipantQuery;
  isSubmitting: boolean;
  onChange: (values: ParticipantQuery) => void;
  onSubmit: (query: ParticipantQuery) => void;
}

interface FormErrors {
  fullName?: string;
  studentId?: string;
}

/** A valid placeholder so validateParticipant() checks only the name (its rules stay unchanged). */
const NAME_ONLY_CHECK = 'name@example.com';

function validate(values: ParticipantQuery): FormErrors {
  return {
    fullName: validateParticipant(values.fullName, NAME_ONLY_CHECK).fullName || undefined,
    studentId: validateStudentId(values.studentId) || undefined,
  };
}

export function VerifyForm({ values, isSubmitting, onChange, onSubmit }: VerifyFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (found.fullName || found.studentId) {
      const firstInvalid = event.currentTarget.querySelector<HTMLInputElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }
    onSubmit({ ...values, studentId: normalizeStudentId(values.studentId) });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="الاسم الكامل"
        hint="اكتب اسمك كما سجّلته عند حضور الفعالية."
        name="fullName"
        autoComplete="name"
        placeholder="مثال: ريم أحمد"
        value={values.fullName}
        error={errors.fullName}
        disabled={isSubmitting}
        onChange={(e) => {
          onChange({ ...values, fullName: e.target.value });
          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
        }}
      />
      <TextField
        label="الرقم الجامعي"
        hint="رقمك الجامعي المسجّل عند الحضور."
        name="studentId"
        type="text"
        dir="ltr"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder="مثال: 2210045"
        value={values.studentId}
        error={errors.studentId}
        disabled={isSubmitting}
        onChange={(e) => {
          onChange({ ...values, studentId: e.target.value });
          if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: undefined }));
        }}
      />
      <Button type="submit" icon="search" loading={isSubmitting} loadingLabel="جارٍ التحقق…" fullWidth>
        التحقق من الحضور
      </Button>
      <p className={styles.privacy}>نستخدم بياناتك فقط للبحث عن سجل حضورك، ولا تُعرض بيانات أي مشارك آخر.</p>
    </form>
  );
}
