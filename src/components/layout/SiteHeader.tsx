import fcitLogo from '../../assets/brand/fcit-logo-white.png';
import { site } from '../../config/site';
import { ClubLogo } from '../brand/ClubLogo';
import styles from './SiteHeader.module.css';

/** Black top bar as on the designer guide cover: faculty logo on the right, AIClub on the left. */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <img src={fcitLogo} alt={site.facultyAr} className={styles.fcit} width={139} height={128} />
        <ClubLogo />
      </div>
    </header>
  );
}
