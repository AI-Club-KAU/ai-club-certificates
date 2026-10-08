import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Notice.module.css';

interface NoticeProps {
  tone: 'info' | 'warning';
  icon?: IconName;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

/** Empty / error state block: icon, short title, one helpful line, actions. */
export function Notice({ tone, icon = 'alert', title, children, actions }: NoticeProps) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role="status">
      <span className={styles.icon}>
        <Icon name={icon} size={26} />
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {children && <div className={styles.text}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
