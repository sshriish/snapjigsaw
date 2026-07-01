import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Download, Share2, Link2, Check, X, ArrowLeft } from 'lucide-react';
import { getOrCreateShareLink } from '../lib/polaroidSync';

interface Polaroid {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
  frameStyle: string;
  imagePath?: string;
  shareSlug?: string | null;
}

interface PolaroidWallProps {
  polaroids: Polaroid[];
  onDelete: (id: string) => void;
  onBack: () => void;
  /** Whether the user is signed in and synced, so a persistent share link can be generated. */
  canShareLink?: boolean;
}

export const PolaroidWall: React.FC<PolaroidWallProps> = ({ polaroids, onDelete, onBack, canShareLink = false }) => {
  const [activeLightbox, setActiveLightbox] = useState<Polaroid | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Generate a random rotation/tilt angle for each polaroid on the scrapbook wall
  // We seed this based on the ID string to keep the tilt angle consistent across updates.
  const getTiltAngle = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Return a tilt between -6 and +6 degrees
    return (hash % 12) - 6;
  };

  const handleDownload = async (polaroid: Polaroid) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = polaroid.imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Draw frame styling
    if (polaroid.frameStyle === 'neon') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, 640, 800);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 634, 794);
    } else if (polaroid.frameStyle === 'vintage-dark') {
      ctx.fillStyle = '#2a2522';
      ctx.fillRect(0, 0, 640, 800);
    } else if (polaroid.frameStyle === 'cyberpunk') {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, 640, 800);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 634, 794);
    } else {
      ctx.fillStyle = '#fdfdfd';
      ctx.fillRect(0, 0, 640, 800);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 632, 792);
    }

    // Draw Photo
    ctx.drawImage(img, 32, 32, 576, 576);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(32, 32, 576, 576);

    // Draw Text
    ctx.textAlign = 'center';
    let textStyle = '#1a1a24';
    if (polaroid.frameStyle === 'neon' || polaroid.frameStyle === 'vintage-dark') {
      textStyle = '#ffffff';
    } else if (polaroid.frameStyle === 'cyberpunk') {
      textStyle = '#39ff14';
    }
    ctx.fillStyle = textStyle;

    ctx.font = '36px "Satisfy", "Brush Script MT", cursive';
    ctx.fillText(polaroid.caption, 320, 670);

    ctx.font = '22px "Satisfy", "Brush Script MT", cursive';
    ctx.fillStyle = polaroid.frameStyle === 'cyberpunk' ? '#ff007f' : textStyle;
    ctx.fillText(polaroid.date, 320, 730);

    try {
      const link = document.createElement('a');
      link.download = `${polaroid.caption.replace(/\s+/g, '-').toLowerCase()}-${polaroid.id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleShare = async (polaroid: Polaroid) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = polaroid.imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    if (polaroid.frameStyle === 'neon') {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, 640, 800);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 634, 794);
    } else if (polaroid.frameStyle === 'vintage-dark') {
      ctx.fillStyle = '#2a2522';
      ctx.fillRect(0, 0, 640, 800);
    } else if (polaroid.frameStyle === 'cyberpunk') {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, 640, 800);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 634, 794);
    } else {
      ctx.fillStyle = '#fdfdfd';
      ctx.fillRect(0, 0, 640, 800);
    }

    ctx.drawImage(img, 32, 32, 576, 576);

    ctx.textAlign = 'center';
    let textStyle = '#1a1a24';
    if (polaroid.frameStyle === 'neon' || polaroid.frameStyle === 'vintage-dark') {
      textStyle = '#ffffff';
    } else if (polaroid.frameStyle === 'cyberpunk') {
      textStyle = '#39ff14';
    }
    ctx.fillStyle = textStyle;
    ctx.font = '36px "Satisfy", "Brush Script MT", cursive';
    ctx.fillText(polaroid.caption, 320, 670);

    ctx.font = '22px "Satisfy", "Brush Script MT", cursive';
    ctx.fillStyle = polaroid.frameStyle === 'cyberpunk' ? '#ff007f' : textStyle;
    ctx.fillText(polaroid.date, 320, 730);

    try {
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
          alert('Web Share is not supported on this browser. Use Download instead.');
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.warn('Sharing failed:', err);
    }
  };

  const handleCopyShareLink = async (polaroid: Polaroid) => {
    setIsGeneratingLink(true);
    try {
      const url = await getOrCreateShareLink(polaroid.id, polaroid.shareSlug ?? null);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to create share link:', err);
      alert('Could not create a share link right now. Please try again.');
    } finally {
      setIsGeneratingLink(false);
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
            Complete 3 jigsaw puzzles in a row to earn your first digital polaroid memory card!
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
                  className={`scrapbook-polaroid style-${polaroid.frameStyle}`}
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
                    <span className="polaroid-caption">{polaroid.caption}</span>
                    <span className="polaroid-date">{polaroid.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Detailed View Modal */}
      {activeLightbox && (
        <div className="lightbox-overlay" onClick={() => setActiveLightbox(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className={`polaroid-frame style-${activeLightbox.frameStyle}`} style={{ transform: 'none' }}>
              <div className="polaroid-image-container">
                <img
                  src={activeLightbox.imageUrl}
                  alt={activeLightbox.caption}
                  className="polaroid-photo developed"
                />
              </div>
              <div className="polaroid-info">
                <span className="polaroid-caption">{activeLightbox.caption}</span>
                <span className="polaroid-date">{activeLightbox.date}</span>
              </div>
            </div>

            <div className="lightbox-actions">
              <button className="btn-secondary" onClick={() => handleDownload(activeLightbox)}>
                <Download size={16} /> Download
              </button>
              <button className="btn-secondary" onClick={() => handleShare(activeLightbox)}>
                <Share2 size={16} /> Share
              </button>
              {canShareLink && (
                <button
                  className="btn-secondary"
                  onClick={() => handleCopyShareLink(activeLightbox)}
                  disabled={isGeneratingLink}
                  title="Copy a public link anyone can open"
                >
                  {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
                  {linkCopied ? 'Link Copied!' : 'Copy Link'}
                </button>
              )}
              <button className="btn-danger" onClick={() => handleDeleteWithConfirmation(activeLightbox.id)}>
                <Trash2 size={16} /> Delete Memory
              </button>
              <button className="btn-secondary" onClick={() => setActiveLightbox(null)} style={{ padding: '8px' }}>
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
