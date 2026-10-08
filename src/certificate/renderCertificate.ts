import { certificateConfig as cfg } from '../config/certificate';
import type { CertificateContent } from '../types';
import { drawCenteredLine, fitFontSize, measureText, wrapText, type TextStyle } from './canvasText';

let templatePromise: Promise<HTMLImageElement> | null = null;

/** Loads the official template once and reuses it for every certificate. */
function loadTemplate(): Promise<HTMLImageElement> {
  templatePromise ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => {
      templatePromise = null;
      reject(new Error('Certificate template failed to load.'));
    };
    image.src = cfg.templateUrl;
  });
  return templatePromise;
}

/**
 * Canvas only uses a web font after it is loaded (spec: wait for Readex Pro before drawing).
 * Each weight is requested with text containing both Arabic and Latin characters.
 */
async function ensureFonts(content: CertificateContent): Promise<void> {
  const sample = `${content.name} ${content.sentence} ${content.title} ${content.dateLine} أبجد ABC 123`;
  const weights = new Set(Object.values(cfg.fields).map((field) => field.weight));
  await Promise.all([...weights].map((w) => document.fonts.load(`${w} 64px "${cfg.fontFamily}"`, sample)));
  await document.fonts.ready;
}

function styleFor(field: { size: number; weight: number }, color: string): TextStyle {
  return { family: cfg.fontFamily, size: field.size, weight: field.weight, color };
}

/** A single centred line; shrinks between size and minSize when wider than the max width. */
function drawFittedLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  field: { y: number; size: number; weight: number; minSize?: number },
  color: string,
): void {
  if (!text) return;
  let style = styleFor(field, color);
  if (field.minSize) style = { ...style, size: fitFontSize(ctx, text, style, field.minSize, cfg.maxTextWidth) };
  drawCenteredLine(ctx, text, style, cfg.centerX, field.y);
}

/** Title: one line (shrinking to its minimum); wraps only as a last resort for very long titles. */
function drawTitle(ctx: CanvasRenderingContext2D, title: string): void {
  if (!title) return;
  const field = cfg.fields.title;
  const base = styleFor(field, cfg.colors.title);
  const style = { ...base, size: fitFontSize(ctx, title, base, field.minSize, cfg.maxTextWidth) };

  if (measureText(ctx, title, style) <= cfg.maxTextWidth) {
    drawCenteredLine(ctx, title, style, cfg.centerX, field.y);
    return;
  }
  const lines = wrapText(ctx, title, style, cfg.maxTextWidth);
  const lineHeight = style.size * field.lineHeight;
  const firstY = field.y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => drawCenteredLine(ctx, line, style, cfg.centerX, firstY + i * lineHeight));
}

/** Draws a full-resolution certificate (3200×2262) and returns the canvas. */
export async function renderCertificate(content: CertificateContent): Promise<HTMLCanvasElement> {
  const [template] = await Promise.all([loadTemplate(), ensureFonts(content)]);

  const canvas = document.createElement('canvas');
  canvas.width = cfg.width;
  canvas.height = cfg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser.');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(template, 0, 0, cfg.width, cfg.height);

  drawFittedLine(ctx, content.name, cfg.fields.name, cfg.colors.text);
  drawFittedLine(ctx, content.sentence, cfg.fields.sentence, cfg.colors.text);
  drawTitle(ctx, content.title);
  drawFittedLine(ctx, content.dateLine, cfg.fields.date, cfg.colors.text);

  return canvas;
}