// Shared polaroid frame style catalogue + canvas rendering helpers.
// Add a new frame here and it automatically shows up in the unlock grid,
// the live preview (via CSS in App.css), and the downloaded/shared JPG.

export interface FrameStyleOption {
  id: string;
  name: string;
  required: number; // kept for backwards compatibility, always 0 now — every frame is available from the start
}

// All frame styles are unlocked from the very first polaroid — old-school users and
// gen-Z users alike get the full picker immediately instead of grinding for it.
export const FRAME_STYLES: FrameStyleOption[] = [
  { id: 'classic', name: 'Classic', required: 0 },
  { id: 'kraft', name: 'Kraft Paper', required: 0 },
  { id: 'neon', name: 'Synthwave', required: 0 },
  { id: 'mint', name: 'Mint Fresh', required: 0 },
  { id: 'vintage-dark', name: 'Noir Dark', required: 0 },
  { id: 'gold', name: 'Gilded', required: 0 },
  { id: 'rose', name: 'Rose Gold', required: 0 },
  { id: 'blueprint', name: 'Blueprint', required: 0 },
  { id: 'cyberpunk', name: 'Cyberpunk', required: 0 },
  { id: 'holo', name: 'Holographic', required: 0 }
];

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------
export type PolaroidOrientation = 'vertical' | 'horizontal';

// ---------------------------------------------------------------------------
// Caption / date font catalogue — mix of "old school" handwritten/typewriter
// looks and bolder "gen-Z" display fonts. Font files are pulled in via the
// Google Fonts @import already living in src/index.css.
// ---------------------------------------------------------------------------
export interface FontOption {
  id: string;
  name: string;
  family: string;
  vibe: 'classic' | 'modern';
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'satisfy', name: 'Satisfy', family: "'Satisfy', cursive", vibe: 'classic' },
  { id: 'caveat', name: 'Caveat', family: "'Caveat', cursive", vibe: 'classic' },
  { id: 'homemade-apple', name: 'Homemade Apple', family: "'Homemade Apple', cursive", vibe: 'classic' },
  { id: 'special-elite', name: 'Typewriter', family: "'Special Elite', monospace", vibe: 'classic' },
  { id: 'shadows-into-light', name: 'Shadows Light', family: "'Shadows Into Light', cursive", vibe: 'classic' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", vibe: 'modern' },
  { id: 'permanent-marker', name: 'Marker', family: "'Permanent Marker', cursive", vibe: 'modern' },
  { id: 'bebas-neue', name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", vibe: 'modern' },
  { id: 'pacifico', name: 'Pacifico', family: "'Pacifico', cursive", vibe: 'modern' }
];

export const DEFAULT_FONT_ID = 'satisfy';

export function getFontOption(fontId: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
}

export function getFontFamily(fontId: string): string {
  return getFontOption(fontId).family;
}

/** Makes sure a webfont is actually loaded before we draw text with it onto
 *  a <canvas> — otherwise the canvas silently falls back to a system font. */
export async function ensureFontLoaded(fontId: string, sizePx = 40): Promise<void> {
  const family = getFontFamily(fontId);
  try {
    await document.fonts.load(`${sizePx}px ${family}`);
  } catch {
    // Best-effort only — canvas will fall back gracefully if this fails.
  }
}

// ---------------------------------------------------------------------------
// Text color presets — a handful of curated swatches, but the UI also exposes
// a native color picker so users aren't limited to these.
// ---------------------------------------------------------------------------
export const TEXT_COLOR_PRESETS: string[] = [
  '#1a1a24', // ink
  '#ffffff', // white
  '#ff2d78', // hot pink
  '#39ff14', // acid green
  '#facc15', // gold/yellow
  '#63b3ed', // sky blue
  '#a855f7', // purple
  '#fb7185' // rose
];

/** Paints the polaroid card background + border for a given frame style. */
export function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  frameStyle: string,
  width: number,
  height: number
) {
  switch (frameStyle) {
    case 'neon':
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
      break;

    case 'vintage-dark':
      ctx.fillStyle = '#2a2522';
      ctx.fillRect(0, 0, width, height);
      break;

    case 'cyberpunk':
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
      break;

    case 'kraft':
      ctx.fillStyle = '#c9a876';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(61, 43, 26, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(14, 14, width - 28, height - 28);
      ctx.setLineDash([]);
      break;

    case 'mint':
      ctx.fillStyle = '#eafaf1';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, width - 8, height - 8);
      break;

    case 'gold':
      ctx.fillStyle = '#1a1508';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 5;
      ctx.strokeRect(6, 6, width - 12, height - 12);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, width - 28, height - 28);
      break;

    case 'rose':
      ctx.fillStyle = '#fff0f3';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, width - 8, height - 8);
      break;

    case 'blueprint': {
      ctx.fillStyle = '#0a2540';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(99, 179, 237, 0.18)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= width; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy <= height; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = '#63b3ed';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, width - 8, height - 8);
      break;
    }

    case 'holo': {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#a855f7');
      grad.addColorStop(0.35, '#06b6d4');
      grad.addColorStop(0.65, '#f472b6');
      grad.addColorStop(1, '#facc15');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(0, 0, width, height);
      break;
    }

    default: // classic
      ctx.fillStyle = '#fdfdfd';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, width - 8, height - 8);
      break;
  }
}

/** Caption/body text color that reads well against a given frame background. */
export function getFrameTextColor(frameStyle: string): string {
  switch (frameStyle) {
    case 'neon':
    case 'vintage-dark':
    case 'blueprint':
    case 'holo':
      return '#ffffff';
    case 'cyberpunk':
      return '#39ff14';
    case 'gold':
      return '#d4af37';
    case 'kraft':
      return '#3d2b1a';
    case 'mint':
      return '#064e3b';
    case 'rose':
      return '#881337';
    default:
      return '#1a1a24';
  }
}

/** Date text color - most frames reuse the body text color, a couple accent it. */
export function getFrameDateColor(frameStyle: string): string {
  if (frameStyle === 'cyberpunk') return '#ff007f';
  return getFrameTextColor(frameStyle);
}
