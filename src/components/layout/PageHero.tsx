import { PixelCluster } from '../brand/PixelCluster';
import { Sparkle } from '../brand/Sparkle';
import styles from './PageHero.module.css';

interface PageHeroProps {
  title: string;
  subtitle: string;
}

/**
 * Black hero in the style of the designer guide cover: white title on a purple
 * bar that bleeds to the page edge and fades out, a green sparkle, and pixel squares.
 */
export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className={styles.hero}>
      <PixelCluster pattern="pyramid" size={44} className={styles.pyramid} />
      <PixelCluster pattern="staircase" size={36} className={styles.staircase} />
      <PixelCluster pattern="step" size={30} className={styles.step} />

      <div className={styles.inner}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <span className={styles.bar}>{title}</span>
          </h1>
          <Sparkle size={30} className={styles.sparkle} />
        </div>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </section>
  );
}
