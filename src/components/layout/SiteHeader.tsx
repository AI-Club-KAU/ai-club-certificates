import { ClubLogo } from '../brand/ClubLogo';
import styles from './SiteHeader.module.css';

/** Black top bar as on the designer guide cover, with the AIClub logo on the left. */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <ClubLogo />
      </div>
    </header>
  );
}
