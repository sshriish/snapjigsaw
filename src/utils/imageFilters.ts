// Canvas-based photo filters baked into the image.

export type FilterType =
  | 'none'
  | 'cinematic'
  | 'vintage'
  | 'sepia'
  | 'bw'
  | 'vhs'
  | 'warm_film'
  | 'cool_tone'
  | 'grainy_35mm'
  | 'polaroid_classic';

export interface FilterOption {
  id: FilterType;
  name: string;
  description: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'none', name: 'Original', description: 'No filter applied' },
  { id: 'cinematic', name: 'Cinematic', description: 'Rich contrast, warm highlights & vignette' },
  { id: 'vintage', name: 'Vintage Faded', description: 'Raised blacks, faded colors' },
  { id: 'sepia', name: 'Warm Sepia', description: 'Classic nostalgic warm tones' },
  { id: 'bw', name: 'Noir B&W', description: 'High contrast black and white' },
  { id: 'vhs', name: 'VHS Tape', description: 'Glitchy chromatic aberration & tracking grain' },
  { id: 'warm_film', name: 'Warm Film', description: 'Golden hour highlights' },
  { id: 'cool_tone', name: 'Cool Film', description: 'Moody blue highlights & cold shadows' },
  { id: 'grainy_35mm', name: 'Grainy 35mm', description: 'Heavy analog noise & film contrast' },
  { id: 'polaroid_classic', name: 'Polaroid Classic', description: 'High exposure, soft glow & pastel tones' }
];

/**
 * Applies a filter to an image source and returns the filtered image as a data URL.
 */
export async function applyFilter(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  filter: FilterType
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for canvas filter application');

  // Determine source dimensions
  let width = 0;
  let height = 0;
  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth;
    height = source.videoHeight;
  } else if (source instanceof HTMLImageElement) {
    width = source.naturalWidth;
    height = source.naturalHeight;
  } else {
    width = source.width;
    height = source.height;
  }

  // Ensure reasonable resolution for processing
  canvas.width = width || 640;
  canvas.height = height || 480;

  // Draw base image
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  if (filter === 'none') {
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const len = data.length;

  switch (filter) {
    case 'bw':
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard luminance weights, but slightly boosted for high contrast B&W
        const v = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // High contrast S-curve
        const norm = v / 255;
        const contrast = norm < 0.5 ? 2 * norm * norm : 1 - 2 * (1 - norm) * (1 - norm);
        const finalVal = Math.min(255, Math.max(0, contrast * 255));

        data[i] = finalVal;
        data[i + 1] = finalVal;
        data[i + 2] = finalVal;
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'sepia':
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
        data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
        data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'vintage':
      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Faded contrast (raised black, compressed highlights)
        r = r * 0.8 + 30;
        g = g * 0.8 + 25;
        b = b * 0.75 + 40; // slightly blue shadows

        // 2. Reduce saturation by blending with luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = Math.min(255, r * 0.7 + lum * 0.3);
        data[i + 1] = Math.min(255, g * 0.7 + lum * 0.3);
        data[i + 2] = Math.min(255, b * 0.75 + lum * 0.25);
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'cinematic':
      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Warm color grading: boost Red/Green slightly, push Blue down in shadows
        // Apply film S-curve contrast
        const applyS = (v: number) => {
          const norm = v / 255;
          return (norm < 0.5 ? 2 * norm * norm : 1 - 2 * (1 - norm) * (1 - norm)) * 255;
        };

        r = applyS(r) * 1.05;
        g = applyS(g);
        b = applyS(b) * 0.9;

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
      ctx.putImageData(imgData, 0, 0);
      applyVignette(ctx, canvas.width, canvas.height, 0.45);
      break;

    case 'warm_film':
      for (let i = 0; i < len; i += 4) {
        // Boost warmth: Red +, Green slightly +, Blue -
        data[i] = Math.min(255, data[i] * 1.1 + 10);
        data[i + 1] = Math.min(255, data[i + 1] * 1.02 + 5);
        data[i + 2] = Math.min(255, data[i + 2] * 0.85 + 2);
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'cool_tone':
      for (let i = 0; i < len; i += 4) {
        // Boost cool tones: Blue +, Green slightly +, Red -
        data[i] = Math.min(255, data[i] * 0.85 + 5);
        data[i + 1] = Math.min(255, data[i + 1] * 1.02 + 5);
        data[i + 2] = Math.min(255, data[i + 2] * 1.15 + 15);
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'grainy_35mm':
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 1. Moderate contrast increase
        const nc = (x: number) => {
          const norm = x / 255;
          return Math.min(255, Math.max(0, (1.1 * (norm - 0.5) + 0.5) * 255));
        };

        // 2. Generate random noise grain (additive)
        const grainAmount = 28; // Heavy noise grain
        const noise = (Math.random() - 0.5) * grainAmount;

        // 3. Film warm shift
        data[i] = Math.min(255, Math.max(0, nc(r) + noise + 8));
        data[i + 1] = Math.min(255, Math.max(0, nc(g) + noise));
        data[i + 2] = Math.min(255, Math.max(0, nc(b) + noise - 4));
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'polaroid_classic':
      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Brighten highlights (high exposure, slightly washed highlights)
        r = r * 0.85 + 45;
        g = g * 0.82 + 40;
        b = b * 0.78 + 50;

        // 2. Decrease contrast
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = Math.min(255, r * 0.85 + lum * 0.15);
        data[i + 1] = Math.min(255, g * 0.85 + lum * 0.15);
        data[i + 2] = Math.min(255, b * 0.85 + lum * 0.15);
      }
      ctx.putImageData(imgData, 0, 0);
      break;

    case 'vhs':
      // Chromatic Aberration: Shift channels
      // Create separate buffers for color channels
      const rBuffer = new Uint8ClampedArray(canvas.width * canvas.height);
      const gBuffer = new Uint8ClampedArray(canvas.width * canvas.height);
      const bBuffer = new Uint8ClampedArray(canvas.width * canvas.height);

      for (let i = 0; i < len; i += 4) {
        const pixelIdx = i / 4;
        rBuffer[pixelIdx] = data[i];
        gBuffer[pixelIdx] = data[i + 1];
        bBuffer[pixelIdx] = data[i + 2];
      }

      // Re-draw with shifted channels
      const shiftX = Math.round(canvas.width * 0.008); // Shift red channel left, blue channel right
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const targetIdx = (y * canvas.width + x) * 4;
          
          // Shift red channel left
          const rx = Math.max(0, x - shiftX);
          const rSourceIdx = y * canvas.width + rx;
          
          // Keep green as is
          const gSourceIdx = y * canvas.width + x;

          // Shift blue channel right
          const bx = Math.min(canvas.width - 1, x + shiftX);
          const bSourceIdx = y * canvas.width + bx;

          let r = rBuffer[rSourceIdx];
          const g = gBuffer[gSourceIdx];
          let b = bBuffer[bSourceIdx];

          // Add a tracking static noise scan line
          const scanlineIntensity = Math.sin(y * 0.3) * 12;
          const noise = (Math.random() - 0.5) * 22;

          r = Math.min(255, Math.max(0, r + scanlineIntensity + noise));
          const finalG = Math.min(255, Math.max(0, g + scanlineIntensity + noise));
          b = Math.min(255, Math.max(0, b + scanlineIntensity + noise));

          data[targetIdx] = r;
          data[targetIdx + 1] = finalG;
          data[targetIdx + 2] = b;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      
      // Draw horizontal static lines (representing VHS tracking error)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      const staticY = Math.random() * canvas.height;
      ctx.fillRect(0, staticY, canvas.width, 3);
      break;
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Applies a vignette to the canvas.
 */
function applyVignette(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const center = { x: width / 2, y: height / 2 };
  const maxRadius = Math.sqrt(center.x * center.x + center.y * center.y);

  const grad = ctx.createRadialGradient(
    center.x, center.y, maxRadius * 0.4,
    center.x, center.y, maxRadius
  );

  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
