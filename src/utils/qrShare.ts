import qrcodeFactory from './qrcodeLib';

export interface PolaroidQrResult {
  svg: string;
  moduleCount: number;
  thumbnailDataUrl: string;
  thumbnailBytes: number;
}

// There's no server to upload the photo to, so the QR code has to carry the
// whole image itself (as a data: URL) — anyone who scans it opens the photo
// straight from the code, offline, even if it was printed on paper.
// QR codes top out around ~2950 raw bytes at version 40 with the lowest
// error-correction level, and denser codes get harder for phone cameras to
// scan reliably (especially once printed), so we aim well under that and
// use 'M' error correction for a bit of smudge/print tolerance.
const MAX_PAYLOAD_BYTES = 1100;

const THUMB_WIDTHS = [110, 96, 84, 72, 60, 50, 42];
const JPEG_QUALITIES = [0.45, 0.35, 0.28, 0.22, 0.16, 0.12, 0.08];

function buildTinyThumbnail(source: HTMLCanvasElement): string | null {
  const aspect = source.height / source.width;

  for (const width of THUMB_WIDTHS) {
    const height = Math.max(1, Math.round(width * aspect));
    const small = document.createElement('canvas');
    small.width = width;
    small.height = height;
    const ctx = small.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);

    for (const quality of JPEG_QUALITIES) {
      const dataUrl = small.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_PAYLOAD_BYTES) {
        return dataUrl;
      }
    }
  }

  return null;
}

function buildQrSvg(data: string): { svg: string; moduleCount: number } | null {
  for (let typeNumber = 1; typeNumber <= 40; typeNumber += 1) {
    try {
      const qr = qrcodeFactory(typeNumber, 'M');
      qr.addData(data);
      qr.make();
      return { svg: qr.createSvgTag(6, 24), moduleCount: qr.getModuleCount() };
    } catch {
      // Payload doesn't fit at this type number — try the next, larger one.
      continue;
    }
  }
  return null;
}

/**
 * Builds a self-contained, scannable QR code that embeds a compressed
 * preview of the given polaroid canvas directly as a data: URL. No network
 * request or backend of any kind is involved — the photo travels entirely
 * inside the code, so it works even printed on paper with no phone signal.
 */
export function generatePolaroidShareQr(source: HTMLCanvasElement): PolaroidQrResult | null {
  const thumbnailDataUrl = buildTinyThumbnail(source);
  if (!thumbnailDataUrl) return null;

  const qr = buildQrSvg(thumbnailDataUrl);
  if (!qr) return null;

  return {
    svg: qr.svg,
    moduleCount: qr.moduleCount,
    thumbnailDataUrl,
    thumbnailBytes: thumbnailDataUrl.length
  };
}

/** Rasterizes the QR SVG string to a downloadable/printable PNG data URL. */
export async function qrSvgToPngDataUrl(svg: string, pixelSize = 900): Promise<string> {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to rasterize QR SVG'));
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pixelSize, pixelSize);
    ctx.drawImage(img, 0, 0, pixelSize, pixelSize);

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
