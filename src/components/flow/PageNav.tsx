import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import styles from './PageNav.module.css';

interface PageNavProps {
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
}

/** "السابق / التالي" bar at the bottom of each page. Hidden buttons keep their space so nothing jumps. */
export function PageNav({ canGoBack, canGoNext, onBack, onNext }: PageNavProps) {
  if (!canGoBack && !canGoNext) return null;
  return (
    <nav className={styles.nav} aria-label="التنقل بين الصفحات">
      <span className={styles.slot}>
        {canGoBack && (
          <Button variant="ghost" icon="back" onClick={onBack}>
            السابق
          </Button>
        )}
      </span>
      <span className={styles.slot}>
        {canGoNext && (
          <Button variant="ghost" onClick={onNext} className={styles.next}>
            التالي
            <Icon name="forward" size={20} />
          </Button>
        )}
      </span>
    </nav>
  );
}
