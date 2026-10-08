import markWhite from '../../assets/brand/aiclub-mark-white.png';
import styles from './ClubLogo.module.css';

interface ClubLogoProps {
  className?: string;
}

/** White mark + "AIClub" wordmark ("AI" in green), as on the designer guide cover. For dark backgrounds. */
export function ClubLogo({ className }: ClubLogoProps) {
  return (
    <span className={[styles.logo, className].filter(Boolean).join(' ')} dir="ltr">
      <img src={markWhite} alt="" className={styles.mark} width={40} height={40} />
      <span className={styles.wordmark}>
        <span className={styles.ai}>AI</span>Club
      </span>
    </span>
  );
}
