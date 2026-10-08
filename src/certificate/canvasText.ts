export interface TextStyle {
  family: string;
  size: number;
  weight: number;
  color: string;
}

function applyStyle(ctx: CanvasRenderingContext2D, style: TextStyle): void {
  ctx.font = `${style.weight} ${style.size}px "${style.family}"`;
  ctx.fillStyle = style.color;
}

export function measureText(ctx: CanvasRenderingContext2D, text: string, style: TextStyle): number {
  applyStyle(ctx, style);
  return ctx.measureText(text).width;
}

/**
 * Draws one line centred on (centerX, y), as the spec requires:
 * direction "rtl" + textAlign "center". The browser's bidi handling keeps mixed
 * Arabic/English text (e.g. "مقدمة إلى الذكاء الاصطناعي | Introduction to AI") in the right order.
 */
export function drawCenteredLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  centerX: number,
  y: number,
): void {
  applyStyle(ctx, style);
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centerX, y);
}

/** Largest size between `max` and `min` (2 px steps) at which the text fits in `maxWidth`. */
export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  min: number,
  maxWidth: number,
): number {
  for (let size = style.size; size > min; size -= 2) {
    if (measureText(ctx, text, { ...style, size }) <= maxWidth) return size;
  }
  return min;
}

/** Greedy word wrap; returns the lines. */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, style: TextStyle, maxWidth: number): string[] {
  const words = text.split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureText(ctx, candidate, style) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}