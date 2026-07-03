import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Share2, Save, ArrowLeft, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { enhanceImage } from '../utils/imageEnhance';
import { composeMergedImage } from '../utils/imageMerge';
import {
  FRAME_STYLES,
  FONT_OPTIONS,
  TEXT_COLOR_PRESETS,
  DEFAULT_FONT_ID,
  drawFrameBackground,
  getFrameTextColor,
  getFrameDateColor,
  getFontFamily,
  ensureFontLoaded,
  type PolaroidOrientation
} from '../utils/frameStyles';

interface PolaroidRevealProps {
  photos: string[]; // 1-3 photos, already have filters baked in. >1 gets merged into a collage.
  totalPolaroidsCount: number;
  perfectStreak: boolean;
  onSave: (polaroid: {
    id: string;
    imageUrl: string;
    caption: string;
    date: string;
    frameStyle: string;
    orientation: PolaroidOrientation;
    showDate: boolean;
    fontId: string;
    textColor: string;
    dateColor: string;
  }) => void;
  onCancel: () => void;
}

export const PolaroidReveal: React.FC<PolaroidRevealProps> = ({
  photos,
  totalPolaroidsCount,
  perfectStreak,
  onSave,
  onCancel
}) => {
  const isMerge = photos.length > 1;
  const previewPhoto = photos[0];

  const [isEnhancing, setIsEnhancing] = useState(true);
  const [enhancedPhoto, setEnhancedPhoto] = useState<string | null>(null);
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [caption, setCaption] = useState('');
  const [frameStyle, setFrameStyle] = useState('classic');
  const [orientation, setOrientation] = useState<PolaroidOrientation>('vertical');
  const [showDate, setShowDate] = useState(true);
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID);
  const [textColor, setTextColor] = useState(getFrameTextColor('classic'));
  const [dateColor, setDateColor] = useState(getFrameDateColor('classic'));
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const polaroidRef = useRef<HTMLDivElement>(null);

  // 1. Run AI Enhancement Pass on every photo, then merge into one flattened
  //    square image (a no-op merge when there's only a single photo).
  useEffect(() => {
    let active = true;

    async function runEnhancement() {
      setIsEnhancing(true);
      try {
        const enhancedList = await Promise.all(photos.map((p) => enhanceImage(p)));
        if (!active) return;
        const merged = await composeMergedImage(enhancedList);
        if (!active) return;
        setEnhancedPhoto(merged);
        setIsEnhancing(false);

        // 2. Start developing chemical reveal animation
        setIsDeveloping(true);
      } catch (err) {
        console.error('Enhancement pipeline failed, falling back:', err);
        if (!active) return;
        try {
          const fallbackMerged = await composeMergedImage(photos);
          if (!active) return;
          setEnhancedPhoto(fallbackMerged);
        } catch {
          if (!active) return;
          setEnhancedPhoto(previewPhoto);
        }
        setIsEnhancing(false);
        setIsDeveloping(true);
      }
    }
    void runEnhancement();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // Handle chemical reveal fade duration
  useEffect(() => {
    if (isDeveloping) {
      const timer = setTimeout(() => {
        setIsDeveloping(false);
      }, 3500); // 3.5 seconds chemical development fade
      return () => clearTimeout(timer);
    }
  }, [isDeveloping]);

  // Generate high-resolution downloaded JPG with polaroid frame baked in
  const generatePolaroidCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!enhancedPhoto) return null;

    const isHorizontal = orientation === 'horizontal';
    const canvasW = isHorizontal ? 800 : 640;
    const canvasH = isHorizontal ? 640 : 800;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Load photo image
    const img = new Image();
    img.src = enhancedPhoto;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Make sure the chosen webfont is actually loaded before we draw with it
    await ensureFontLoaded(fontId, 40);

    // 1. Background Fill based on style
    drawFrameBackground(ctx, frameStyle, canvasW, canvasH);

    // 2. Draw Image box — reserve a fixed strip at the bottom for caption/date
    //    so it works for both portrait and landscape polaroid shapes.
    const imgPadX = 32;
    const imgPadY = 32;
    const captionAreaH = showDate ? 168 : 120;
    const imgW = canvasW - imgPadX * 2;
    const imgH = canvasH - imgPadY - captionAreaH;

    ctx.drawImage(img, imgPadX, imgPadY, imgW, imgH);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(imgPadX, imgPadY, imgW, imgH);

    // 3. Draw caption + (optional) date in the user's chosen font & colors
    ctx.textAlign = 'center';
    const centerX = canvasW / 2;
    const fontFamily = getFontFamily(fontId);
    const captionY = imgPadY + imgH + 55;
    const dateY = imgPadY + imgH + 105;

    ctx.fillStyle = textColor;
    ctx.font = `36px ${fontFamily}`;
    const textCaption = caption.trim() || 'A SnapJigsaw Memory';
    ctx.fillText(textCaption, centerX, captionY);

    if (showDate) {
      ctx.font = `22px ${fontFamily}`;
      ctx.fillStyle = dateColor;
      ctx.fillText(dateStr, centerX, dateY);
    }

    return canvas;
  };

  const handleDownload = async () => {
    const canvas = await generatePolaroidCanvas();
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `polaroid-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Failed to download polaroid:', err);
    }
  };

  const handleShare = async () => {
    const canvas = await generatePolaroidCanvas();
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `polaroid-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My SnapJigsaw Polaroid',
            text: 'Look at the digital polaroid memory I just unlocked!'
          });
        } else {
          // Laptop / unsupported fallback — just download it instead
          const link = document.createElement('a');
          link.download = `polaroid-${Date.now()}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.click();
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.warn('Sharing failed:', err);
    }
  };

  const handleSaveToWall = () => {
    if (!enhancedPhoto) return;
    onSave({
      id: `polaroid_${Date.now()}`,
      imageUrl: enhancedPhoto,
      caption: caption.trim() || 'Captured Memory',
      date: dateStr,
      frameStyle,
      orientation,
      showDate,
      fontId,
      textColor,
      dateColor
    });
  };

  return (
    <div className="glass-panel reveal-card">
      {isEnhancing ? (
        <div className="scan-container">
          <img src={previewPhoto} alt="Enhancing scan" className="scan-image" />
          <div className="scanner-bar" />
          <div style={{ position: 'absolute', bottom: '24px', width: '100%', textAlign: 'center', color: '#fff' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Sparkles className="app-logo" size={18} />
              {isMerge ? `Merging ${photos.length} Photos...` : 'AI Quality Enhancer Pass...'}
            </h3>
            <p className="app-subtitle" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {isMerge
                ? 'Compositing your shots into one collage card'
                : 'Upscaling resolution and smoothing sensor grain'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="landing-title" style={{ fontSize: '26px', marginBottom: '8px' }}>
            {isDeveloping ? 'Developing Polaroid...' : 'Your Unlocked Polaroid!'}
          </h2>
          <p className="app-subtitle" style={{ marginBottom: '20px' }}>
            {isDeveloping 
              ? 'Watch the chemicals react as the picture develops' 
              : 'Add a custom handwritten label and customize your photo frame style'}
          </p>
          {!isDeveloping && isMerge && (
            <p className="app-subtitle" style={{ marginTop: '-14px', marginBottom: '20px', fontSize: '12px' }}>
              🧩 Collage made from {photos.length} solved photos
            </p>
          )}

          {/* Polaroid Frame Graphic */}
          <div
            ref={polaroidRef}
            className={`polaroid-frame style-${frameStyle} orientation-${orientation}`}
          >
            <div className="polaroid-image-container">
              <img
                src={enhancedPhoto || previewPhoto}
                alt="Developing snap"
                className={`polaroid-photo ${isDeveloping ? 'developing' : 'developed'}`}
              />
            </div>
            
            <div className="polaroid-info">
              <input
                type="text"
                maxLength={32}
                placeholder={isDeveloping ? '' : 'Write a caption...'}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isDeveloping}
                className="polaroid-caption"
                style={{ fontFamily: getFontFamily(fontId), color: textColor }}
              />
              {showDate && (
                <span className="polaroid-date" style={{ fontFamily: getFontFamily(fontId), color: dateColor }}>
                  {dateStr}
                </span>
              )}
            </div>
          </div>

          {!isDeveloping && (
            <>
              {/* Orientation Toggle */}
              <div className="frame-styles-row">
                <span className="settings-label">Polaroid Shape</span>
                <div className="orientation-toggle-row">
                  <button
                    className={`orientation-toggle-btn ${orientation === 'vertical' ? 'active' : ''}`}
                    onClick={() => setOrientation('vertical')}
                  >
                    <RectangleVertical size={16} /> Vertical
                  </button>
                  <button
                    className={`orientation-toggle-btn ${orientation === 'horizontal' ? 'active' : ''}`}
                    onClick={() => setOrientation('horizontal')}
                  >
                    <RectangleHorizontal size={16} /> Horizontal
                  </button>
                </div>
              </div>

              {/* Frame Style Selectors */}
              <div className="frame-styles-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="settings-label">Frame Style ({totalPolaroidsCount} saved so far)</span>
                  {perfectStreak && (
                    <span className="privacy-badge" style={{ margin: 0, padding: '2px 8px', fontSize: '10px' }}>
                      ★ Perfect Streak!
                    </span>
                  )}
                </div>
                <div className="frame-styles-grid">
                  {FRAME_STYLES.map((style) => (
                    <button
                      key={style.id}
                      className={`frame-style-select-btn ${frameStyle === style.id ? 'active' : ''}`}
                      onClick={() => setFrameStyle(style.id)}
                    >
                      {style.name}
                      {style.id === 'cyberpunk' && perfectStreak && ' (Bonus!)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Selector */}
              <div className="frame-styles-row">
                <span className="settings-label">Caption &amp; Date Font</span>
                <div className="font-styles-grid">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.id}
                      className={`font-select-btn ${fontId === font.id ? 'active' : ''}`}
                      style={{ fontFamily: font.family }}
                      onClick={() => setFontId(font.id)}
                      title={font.vibe === 'classic' ? 'Old-school style' : 'Modern / Gen-Z style'}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color + Date Toggle */}
              <div className="frame-styles-row">
                <span className="settings-label">Text Color</span>
                <div className="color-picker-row">
                  {TEXT_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      className={`color-swatch-btn ${textColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => {
                        setTextColor(c);
                        setDateColor(c);
                      }}
                      title={c}
                    />
                  ))}
                  <label className="color-swatch-custom" title="Custom caption color">
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                  </label>
                  <label className="color-swatch-custom" title="Custom date color">
                    <input type="color" value={dateColor} onChange={(e) => setDateColor(e.target.value)} />
                    <span className="color-swatch-custom-label">Date</span>
                  </label>
                </div>
              </div>

              <div className="frame-styles-row" style={{ marginBottom: '8px' }}>
                <label className="date-toggle-row">
                  <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} />
                  Show date on polaroid
                </label>
              </div>

              {/* Action Buttons Row */}
              <div className="preview-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={handleDownload} title="Download Polaroid Card">
                    <Download size={18} /> Download
                  </button>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={handleShare} title="Share to social media">
                    <Share2 size={18} /> Share
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel} title="Go back and choose a different option">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSaveToWall}>
                    <Save size={18} /> Save to Polaroid Wall
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
