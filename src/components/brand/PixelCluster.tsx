import type { CSSProperties } from 'react';
import styles from './PixelCluster.module.css';

type PixelColor = 'green' | 'white' | 'purple' | 'shade';
type Cell = [row: number, col: number, color: PixelColor];

/** Square arrangements taken from the designer guide's cover page. */
const PATTERNS = {
  /** Green / white / purple staircase (cover, left side). */
  staircase: [
    [0, 0, 'green'],
    [1, 1, 'white'],
    [2, 0, 'purple'],
  ],
  /** White over green step (cover, bottom corner). */
  step: [
    [0, 1, 'white'],
    [1, 0, 'green'],
  ],
  /** Faint "pyramid" of shade squares (cover, top). */
  pyramid: [
    [0, 1, 'shade'],
    [1, 0, 'shade'],
    [1, 2, 'shade'],
  ],
} satisfies Record<string, Cell[]>;

interface PixelClusterProps {
  pattern: keyof typeof PATTERNS;
  /** Size of one square in px. */
  size?: number;
  className?: string;
}

/** Decorative pixel squares from the AI Club identity. Hidden from assistive tech. */
export function PixelCluster({ pattern, size = 40, className }: PixelClusterProps) {
  const cells: Cell[] = PATTERNS[pattern];
  return (
    <div className={[styles.cluster, className].filter(Boolean).join(' ')} style={{ '--px': `${size}px` } as CSSProperties} aria-hidden="true">
      {cells.map(([row, col, color]) => (
        <span key={`${row}-${col}`} className={styles[color]} style={{ gridRow: row + 1, gridColumn: col + 1 }} />
      ))}
    </div>
  );
}
