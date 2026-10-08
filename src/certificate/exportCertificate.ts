import { certificateConfig as cfg } from '../config/certificate';
import { toFileNameSegment } from '../utils/text';

/** Lossless full-size PNG of the rendered certificate. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))), 'image/png');
  });
}

/**
 * Single-page PDF with the PNG embedded losslessly at full resolution.
 * Page is A4-landscape width with the template's exact aspect ratio.
 * pdf-lib is loaded only when a PDF is first requested.
 */
export async function pngToPdfBlob(png: Blob, title: string): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(await png.arrayBuffer());

  const width = cfg.pdf.pageWidthPt;
  const height = (width * cfg.height) / cfg.width;
  const page = pdf.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });

  pdf.setTitle(title);
  pdf.setAuthor(cfg.pdf.author);
  pdf.setCreator(cfg.pdf.author);

  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/** "AI-Club-Certificate-Reemas-Al-Sulami.pdf" */
export function certificateFileName(participantName: string, extension: 'pdf' | 'png'): string {
  const name = toFileNameSegment(participantName);
  return `${cfg.fileNamePrefix}${name ? `-${name}` : ''}.${extension}`;
}

/** Triggers a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give mobile browsers time to start the download before releasing the memory.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
