import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Download, Share2, ArrowLeft } from 'lucide-react';
import { drawFrameBackground, getFrameTextColor, getFrameDateColor, getFontFamily, ensureFontLoaded, DEFAULT_FONT_ID } from '../utils/frameStyles';

interface Polaroid {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
  frameStyle: string;
  orientation?: 'vertical' | 'horizontal';
  showDate?: boolean;
  fontId?: string;
  textColor?: string;
  dateColor?: string;
}

interface PolaroidWallProps {
  polaroids: Polaroid[];
  onDelete: (id: string) => void;
  onBack: () => void;
}

export const PolaroidWall: React.FC<PolaroidWallProps> = ({ polaroids, onDelete, onBack }) => {
  const [activeLightbox, setActiveLightbox] = useState<Polaroid | null>(null);

  // Generate a random rotation/tilt angle for each polaroid on the scrapbook wall
  const getTiltAngle = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 12) - 6;
  };

  const buildCanvas = async (polaroid: Polaroid): Promise<HTMLCanvasElement> => {
    const isHorizontal = polaroid.orientation === 'horizontal';
    const canvasW = isHorizontal ? 800 : 640;
    const canvasH = isHorizontal ? 640 : 800;
    const showDate = polaroid.showDate !== false; // default true for legacy saved polaroids

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    img.src = polaroid.imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const fontId = polaroid.fontId || DEFAULT_FONT_ID;
    await ensureFontLoaded(fontId, 40);

    drawFrameBackground(ctx, polaroid.frameStyle, canvasW, canvasH);

    const imgPadX = 32;
    const imgPadY = 32;
    const captionAreaH = showDate ? 168 : 120;
    const imgW = canvasW - imgPadX * 2;
    const imgH = canvasH - imgPadY - captionAreaH;

    ctx.drawImage(img, imgPadX, imgPadY, imgW, imgH);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(imgPadX, imgPadY, imgW, imgH);

    ctx.textAlign = 'center';
    const centerX = canvasW / 2;
    const fontFamily = getFontFamily(fontId);
    const captionY = imgPadY + imgH + 55;
    const dateY = imgPadY + imgH + 105;

    ctx.fillStyle = polaroid.textColor || getFrameTextColor(polaroid.frameStyle);
    ctx.font = `36px ${fontFamily}`;
    ctx.fillText(polaroid.caption, centerX, captionY);

    if (showDate) {
      ctx.font = `22px ${fontFamily}`;
      ctx.fillStyle = polaroid.dateColor || getFrameDateColor(polaroid.frameStyle);
      ctx.fillText(polaroid.date, centerX, dateY);
    }

    return canvas;
  };

  const handleDownload = async (polaroid: Polaroid) => {
    try {
      const canvas = await buildCanvas(polaroid);
      const link = document.createElement('a');
      link.download = `${polaroid.caption.replace(/\s+/g, '-').toLowerCase()}-${polaroid.id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleShare = async (polaroid: Polaroid) => {
    try {
      const canvas = await buildCanvas(polaroid);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${polaroid.id}.jpg`, { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: polaroid.caption,
            text: 'Check out my SnapJigsaw polaroid memory!'
          });
        } else {
          // Laptop / unsupported fallback — just download it instead
          const link = document.createElement('a');
          link.download = `${polaroid.id}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.click();
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.warn('Sharing failed:', err);
    }
  };

  const handleDeleteWithConfirmation = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this polaroid memory?')) {
      onDelete(id);
      setActiveLightbox(null);
    }
  };

  return (
    <div className="wall-container">
      <div className="wall-header-row">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Main
        </button>
        <div className="wall-stats">
          <div className="wall-stat-badge">
            Total Polaroids: <span className="wall-stat-value">{polaroids.length}</span>
          </div>
        </div>
      </div>

      {polaroids.length === 0 ? (
        <div className="glass-panel empty-wall">
          <ImageIcon className="empty-wall-icon" size={64} />
          <h3>Your Polaroid Wall is Empty</h3>
          <p className="app-subtitle" style={{ maxWidth: '340px' }}>
            Solve a jigsaw puzzle, then choose to turn it into a polaroid — or merge a few
            solved photos together — to earn your first digital memory card!
          </p>
          <button className="btn-primary" onClick={onBack}>
            <Camera size={18} /> Solve Puzzles Now
          </button>
        </div>
      ) : (
        <div className="polaroid-scrapbook">
          {polaroids.map((polaroid) => {
            const rotAngle = getTiltAngle(polaroid.id);
            return (
              <div key={polaroid.id} className="scrapbook-item-wrapper">
                <div
                  className={`scrapbook-polaroid style-${polaroid.frameStyle} orientation-${polaroid.orientation || 'vertical'}`}
                  style={{ transform: `rotate(${rotAngle}deg)` }}
                  onClick={() => setActiveLightbox(polaroid)}
                >
                  <div className="polaroid-image-container">
                    <img
                      src={polaroid.imageUrl}
                      alt={polaroid.caption}
                      className="polaroid-photo developed"
                      loading="lazy"
                    />
                  </div>
                  <div className="polaroid-info">
                    <span
                      className="polaroid-caption"
                      style={{ fontFamily: getFontFamily(polaroid.fontId || DEFAULT_FONT_ID), color: polaroid.textColor }}
                    >
                      {polaroid.caption}
                    </span>
                    {polaroid.showDate !== false && (
                      <span
                        className="polaroid-date"
                        style={{ fontFamily: getFontFamily(polaroid.fontId || DEFAULT_FONT_ID), color: polaroid.dateColor }}
                      >
                        {polaroid.date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeLightbox && (
        <div className="lightbox-overlay" onClick={() => setActiveLightbox(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div
              className={`polaroid-frame style-${activeLightbox.frameStyle} orientation-${activeLightbox.orientation || 'vertical'}`}
              style={{ transform: 'none' }}
            >
              <div className="polaroid-image-container">
                <img
                  src={activeLightbox.imageUrl}
                  alt={activeLightbox.caption}
                  className="polaroid-photo developed"
                />
              </div>
              <div className="polaroid-info">
                <span
                  className="polaroid-caption"
                  style={{ fontFamily: getFontFamily(activeLightbox.fontId || DEFAULT_FONT_ID), color: activeLightbox.textColor }}
                >
                  {activeLightbox.caption}
                </span>
                {activeLightbox.showDate !== false && (
                  <span
                    className="polaroid-date"
                    style={{ fontFamily: getFontFamily(activeLightbox.fontId || DEFAULT_FONT_ID), color: activeLightbox.dateColor }}
                  >
                    {activeLightbox.date}
                  </span>
                )}
              </div>
            </div>

            <div className="lightbox-actions">
              <button className="btn-secondary" onClick={() => handleDownload(activeLightbox)}>
                <Download size={16} /> Download
              </button>
              <button className="btn-secondary" onClick={() => handleShare(activeLightbox)}>
                <Share2 size={16} /> Share
              </button>
              <button className="btn-danger" onClick={() => handleDeleteWithConfirmation(activeLightbox.id)}>
                <Trash2 size={16} /> Delete Memory
              </button>
              <button className="btn-secondary" onClick={() => setActiveLightbox(null)} style={{ padding: '8px' }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
