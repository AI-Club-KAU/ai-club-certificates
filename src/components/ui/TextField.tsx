import { useId, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import styles from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labelled input with hint and inline error, wired up for screen readers. */
export function TextField({ label, hint, error, className, ...inputProps }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={[styles.field, error && styles.hasError, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <input id={id} className={styles.input} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...inputProps} />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
