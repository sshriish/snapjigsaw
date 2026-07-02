import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Share2, Save, ArrowLeft } from 'lucide-react';
import { enhanceImage } from '../utils/imageEnhance';
import { FRAME_STYLES, drawFrameBackground, getFrameTextColor, getFrameDateColor } from '../utils/frameStyles';

interface PolaroidRevealProps {
  photoDataUrl: string; // Already has filters baked in
  totalPolaroidsCount: number;
  perfectStreak: boolean;
  onSave: (polaroid: {
    id: string;
    imageUrl: string;
    caption: string;
    date: string;
    frameStyle: string;
  }) => void;
  onCancel: () => void;
}

export const PolaroidReveal: React.FC<PolaroidRevealProps> = ({
  photoDataUrl,
  totalPolaroidsCount,
  perfectStreak,
  onSave,
  onCancel
}) => {
  const [isEnhancing, setIsEnhancing] = useState(true);
  const [enhancedPhoto, setEnhancedPhoto] = useState<string | null>(null);
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [caption, setCaption] = useState('');
  const [frameStyle, setFrameStyle] = useState('classic');
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const polaroidRef = useRef<HTMLDivElement>(null);

  // 1. Run AI Enhancement Pass
  useEffect(() => {
    let active = true;

    async function runEnhancement() {
      setIsEnhancing(true);
      try {
        const result = await enhanceImage(photoDataUrl);
        if (!active) return;
        setEnhancedPhoto(result);
        setIsEnhancing(false);

        // 2. Start developing chemical reveal animation
        setIsDeveloping(true);
      } catch (err) {
        console.error('Enhancement pipeline failed, falling back:', err);
        if (!active) return;
        setEnhancedPhoto(photoDataUrl);
        setIsEnhancing(false);
        setIsDeveloping(true);
      }
    }
    void runEnhancement();

    return () => {
      active = false;
    };
  }, [photoDataUrl]);

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

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800; // Polaroid shape ratio
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Load photo image
    const img = new Image();
    img.src = enhancedPhoto;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // 1. Background Fill based on style
    drawFrameBackground(ctx, frameStyle, 640, 800);

    // 2. Draw Image box
    const imgPadX = 32;
    const imgPadY = 32;
    const imgW = 640 - imgPadX * 2;
    const imgH = imgW; // square photo

    ctx.drawImage(img, imgPadX, imgPadY, imgW, imgH);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(imgPadX, imgPadY, imgW, imgH);

    // 3. Draw Date and Caption texts in font stylings
    ctx.textAlign = 'center';

    // Choose font colors based on style
    const textStyle = getFrameTextColor(frameStyle);
    ctx.fillStyle = textStyle;

    // We fallback to standard cursive/Satisfy-style cursive look on canvas text
    ctx.font = '36px "Satisfy", "Brush Script MT", cursive';
    const textCaption = caption.trim() || 'A SnapJigsaw Memory';
    ctx.fillText(textCaption, 320, 670);

    ctx.font = '22px "Satisfy", "Brush Script MT", cursive';
    ctx.fillStyle = getFrameDateColor(frameStyle);
    ctx.fillText(dateStr, 320, 730);

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
      frameStyle
    });
  };

  return (
    <div className="glass-panel reveal-card">
      {isEnhancing ? (
        <div className="scan-container">
          <img src={photoDataUrl} alt="Enhancing scan" className="scan-image" />
          <div className="scanner-bar" />
          <div style={{ position: 'absolute', bottom: '24px', width: '100%', textAlign: 'center', color: '#fff' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Sparkles className="app-logo" size={18} /> AI Quality Enhancer Pass...
            </h3>
            <p className="app-subtitle" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Upscaling resolution and smoothing sensor grain
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

          {/* Polaroid Frame Graphic */}
          <div ref={polaroidRef} className={`polaroid-frame style-${frameStyle}`}>
            <div className="polaroid-image-container">
              <img
                src={enhancedPhoto || photoDataUrl}
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
              />
              <span className="polaroid-date">{dateStr}</span>
            </div>
          </div>

          {!isDeveloping && (
            <>
              {/* Frame Style Selectors */}
              <div className="frame-styles-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="settings-label">Unlockable Frames</span>
                  {perfectStreak && (
                    <span className="privacy-badge" style={{ margin: 0, padding: '2px 8px', fontSize: '10px' }}>
                      ★ Perfect Streak Bonus Unlocked!
                    </span>
                  )}
                </div>
                <div className="frame-styles-grid">
                  {FRAME_STYLES.map((style) => {
                    const isLocked = totalPolaroidsCount < style.required && !(style.id === 'cyberpunk' && perfectStreak);
                    return (
                      <button
                        key={style.id}
                        disabled={isLocked}
                        className={`frame-style-select-btn ${frameStyle === style.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                        onClick={() => setFrameStyle(style.id)}
                        title={isLocked ? `Unlocks at ${style.required} total polaroids` : ''}
                      >
                        {style.name}
                        {isLocked && ` (${style.required}★)`}
                        {style.id === 'cyberpunk' && perfectStreak && ' (Bonus!)'}
                      </button>
                    );
                  })}
                </div>
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
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel} title="Discard this Polaroid">
                    <ArrowLeft size={18} /> Discard
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
