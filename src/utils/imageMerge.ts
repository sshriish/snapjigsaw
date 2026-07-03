// Merges 1-3 source photos into a single flattened square image so the rest
// of the app (polaroid preview, canvas export, gallery wall) can keep treating
// a "polaroid" as one image, whether it started life as one snap or a
// multi-photo collage.

/** Draws `img` into the given rect using CSS `object-fit: cover` semantics
 *  (center-cropped, no distortion). */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = dw / dh;

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (srcRatio > dstRatio) {
    // Source is wider than target: crop left/right
    sw = img.naturalHeight * dstRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // Source is taller than target: crop top/bottom
    sh = img.naturalWidth / dstRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MergeOptions {
  /** Fraction (0..1) of the canvas given to the FIRST photo. Only applies
   *  when exactly 2 photos are being merged. Defaults to 0.5 (even split).
   *  Clamped to [0.15, 0.85] so neither photo ever shrinks to nothing. */
  splitRatio?: number;
  /** 'side'  = left/right split, divided by a vertical seam (default)
   *  'stack' = top/bottom split, divided by a horizontal seam */
  orientation?: 'side' | 'stack';
}

/** Collage cell layout per photo count. Coordinates are fractions of the
 *  final square canvas (0..1) so they scale to any output size. */
function getLayoutRects(count: number, options: MergeOptions): Rect[] {
  if (count === 2) {
    const ratio = Math.min(0.85, Math.max(0.15, options.splitRatio ?? 0.5));

    if (options.orientation === 'stack') {
      // Stacked halves, split by a horizontal seam — area given to each
      // photo is user-adjustable via `ratio`.
      return [
        { x: 0, y: 0, w: 1, h: ratio },
        { x: 0, y: ratio, w: 1, h: 1 - ratio }
      ];
    }

    // Side-by-side, split by a vertical seam (default) — area given to
    // each photo is user-adjustable via `ratio`.
    return [
      { x: 0, y: 0, w: ratio, h: 1 },
      { x: ratio, y: 0, w: 1 - ratio, h: 1 }
    ];
  }
  if (count === 3) {
    // One large photo on the left, two stacked on the right
    return [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 }
    ];
  }
  // Single photo fills the whole frame
  return [{ x: 0, y: 0, w: 1, h: 1 }];
}

/**
 * Composites the given photos (newest-first order is fine, no assumptions
 * are made about ordering) into one square image.
 * - 1 photo -> returned as-is (no canvas work needed)
 * - 2 photos -> split by `options.splitRatio`/`options.orientation`
 * - 3 photos -> 1 large + 2 stacked collage
 */
export async function composeMergedImage(
  photos: string[],
  size = 900,
  options: MergeOptions = {}
): Promise<string> {
  if (photos.length === 0) {
    throw new Error('composeMergedImage requires at least one photo');
  }
  if (photos.length === 1) {
    return photos[0];
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2d canvas context for image merge');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const images = await Promise.all(photos.map(loadImage));
  const rects = getLayoutRects(photos.length, options);
  const gap = Math.round(size * 0.008); // thin white "seam" between collage cells

  images.forEach((img, i) => {
    const r = rects[i];
    const dx = r.x * size + (r.x > 0 ? gap : 0);
    const dy = r.y * size + (r.y > 0 ? gap : 0);
    const dw = r.w * size - (r.x > 0 ? gap : 0) - (r.x + r.w < 1 ? gap : 0);
    const dh = r.h * size - (r.y > 0 ? gap : 0) - (r.y + r.h < 1 ? gap : 0);
    drawImageCover(ctx, img, dx, dy, dw, dh);
  });

  return canvas.toDataURL('image/jpeg', 0.95);
}
