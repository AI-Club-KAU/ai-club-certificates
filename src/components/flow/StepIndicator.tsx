import type { FlowPage } from '../../hooks/useCertificateFlow';
import { PAGE_ORDER } from '../../hooks/useCertificateFlow';
import { Icon } from '../ui/Icon';
import styles from './StepIndicator.module.css';

const LABELS: Record<FlowPage, string> = {
  verify: 'التحقق من الحضور',
  events: 'اختيار الفعالية',
  certificate: 'تحميل الشهادة',
};

interface StepIndicatorProps {
  current: FlowPage;
  canOpen: (page: FlowPage) => boolean;
  onOpen: (page: FlowPage) => void;
}

/** Three-step progress with square markers (pixel motif). Reachable steps can be clicked. */
export function StepIndicator({ current, canOpen, onOpen }: StepIndicatorProps) {
  const currentIndex = PAGE_ORDER.indexOf(current);

  return (
    <nav aria-label="خطوات إصدار الشهادة">
      <ol className={styles.steps}>
        {PAGE_ORDER.map((page, index) => {
          const reachable = canOpen(page);
          const state = index === currentIndex ? 'current' : reachable ? 'done' : 'upcoming';
          const content = (
            <>
              <span className={styles.marker}>{state === 'done' ? <Icon name="check" size={16} /> : index + 1}</span>
              <span className={styles.label}>{LABELS[page]}</span>
            </>
          );
          return (
            <li key={page} className={`${styles.step} ${styles[state]}`}>
              {state === 'done' ? (
                <button type="button" className={styles.link} onClick={() => onOpen(page)}>
                  {content}
                </button>
              ) : (
                <span className={styles.link} aria-current={state === 'current' ? 'step' : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
