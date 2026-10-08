import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  /** Text shown (and announced) while loading. */
  loadingLabel?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  loadingLabel,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size={18} /> : icon && <Icon name={icon} size={20} />}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}
