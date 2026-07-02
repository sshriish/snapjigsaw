// Shared polaroid frame style catalogue + canvas rendering helpers.
// Add a new frame here and it automatically shows up in the unlock grid,
// the live preview (via CSS in App.css), and the downloaded/shared JPG.

export interface FrameStyleOption {
  id: string;
  name: string;
  required: number; // total polaroids needed to unlock
}

export const FRAME_STYLES: FrameStyleOption[] = [
  { id: 'classic', name: 'Classic', required: 0 },
  { id: 'kraft', name: 'Kraft Paper', required: 1 },
  { id: 'neon', name: 'Synthwave', required: 2 },
  { id: 'mint', name: 'Mint Fresh', required: 3 },
  { id: 'vintage-dark', name: 'Noir Dark', required: 4 },
  { id: 'gold', name: 'Gilded', required: 5 },
  { id: 'rose', name: 'Rose Gold', required: 6 },
  { id: 'blueprint', name: 'Blueprint', required: 7 },
  { id: 'cyberpunk', name: 'Cyberpunk', required: 8 },
  { id: 'holo', name: 'Holographic', required: 10 }
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
