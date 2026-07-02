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

/** Collage cell layout per photo count. Coordinates are fractions of the
 *  final square canvas (0..1) so they scale to any output size. */
function getLayoutRects(count: number): Rect[] {
  if (count === 2) {
    // Side-by-side halves
    return [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 }
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
 * - 2 photos -> side-by-side split
 * - 3 photos -> 1 large + 2 stacked collage
 */
export async function composeMergedImage(photos: string[], size = 900): Promise<string> {
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
  const rects = getLayoutRects(photos.length);
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
