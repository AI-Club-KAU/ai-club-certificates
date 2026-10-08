import { useState, type FormEvent } from 'react';
import type { ParticipantQuery } from '../../types';
import { hasErrors, validateParticipant, type FieldErrors } from '../../utils/validation';
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

export function VerifyForm({ values, isSubmitting, onChange, onSubmit }: VerifyFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateParticipant(values.fullName, values.email);
    setErrors(found);
    if (hasErrors(found)) {
      const firstInvalid = event.currentTarget.querySelector<HTMLInputElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }
    onSubmit(values);
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
        label="البريد الإلكتروني"
        hint="البريد الذي استخدمته عند الحضور."
        name="email"
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="name@example.com"
        value={values.email}
        error={errors.email}
        disabled={isSubmitting}
        onChange={(e) => {
          onChange({ ...values, email: e.target.value });
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
      />
      <Button type="submit" icon="search" loading={isSubmitting} loadingLabel="جارٍ التحقق…" fullWidth>
        التحقق من الحضور
      </Button>
      <p className={styles.privacy}>نستخدم بياناتك فقط للبحث عن سجل حضورك، ولا تُعرض بيانات أي مشارك آخر.</p>
    </form>
  );
}
