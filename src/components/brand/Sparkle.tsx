interface SparkleProps {
  size?: number;
  className?: string;
}

/** The four-point green sparkle used next to headings in the designer guide. */
export function Sparkle({ size = 28, className }: SparkleProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 0C12.7 7.1 16.9 11.3 24 12 16.9 12.7 12.7 16.9 12 24 11.3 16.9 7.1 12.7 0 12 7.1 11.3 11.3 7.1 12 0Z"
        fill="var(--color-green)"
      />
    </svg>
  );
}
