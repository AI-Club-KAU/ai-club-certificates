import type { ReactNode } from 'react';
import markWhite from '../../assets/brand/aiclub-mark-white.png';
import { site } from '../../config/site';
import { LinkedInLogo, XLogo } from '../ui/Icon';
import styles from './SiteFooter.module.css';

/** Black band with club details, then the white hashtag strip from the bottom of every guide page. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.band}>
        <div className={styles.inner}>
          <div className={styles.club}>
            <img src={markWhite} alt="" width={34} height={34} className={styles.mark} />
            <div>
              <p className={styles.clubName}>{site.clubNameAr}</p>
              <p className={styles.faculty}>{site.facultyAr}</p>
            </div>
          </div>
          <div className={styles.social} dir="ltr">
            <SocialIcon href={site.social.linkedin} label="LinkedIn">
              <LinkedInLogo />
            </SocialIcon>
            <SocialIcon href={site.social.x} label="X">
              <XLogo />
            </SocialIcon>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.handle}>{site.socialHandle}</span>
          </div>
        </div>
      </div>
      <div className={styles.strip}>
        <div className={styles.inner}>
          <p className={styles.hashtag}>{site.hashtag}</p>
          <p className={styles.copy}>© {year} {site.clubNameAr}</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  if (!href) return <span className={styles.icon}>{children}</span>;
  return (
    <a className={styles.icon} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — ${site.socialHandle}`}>
      {children}
    </a>
  );
}
