import React, { useEffect, useState } from 'react';
import { Download, Loader2, QrCode, TriangleAlert, X } from 'lucide-react';
import { generatePolaroidShareQr, qrSvgToPngDataUrl } from '../utils/qrShare';

interface QrShareModalProps {
  // Builds (or re-uses) the full-resolution polaroid canvas on demand.
  getCanvas: () => Promise<HTMLCanvasElement | null>;
  fileName: string;
  onClose: () => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({ getCanvas, fileName, onClose }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      setStatus('loading');
      try {
        const canvas = await getCanvas();
        if (!canvas) throw new Error('No image to encode');

        const result = generatePolaroidShareQr(canvas);
        if (!active) return;

        if (!result) {
          setStatus('error');
          return;
        }

        setSvg(result.svg);
        setStatus('ready');
      } catch (err) {
        console.error('QR generation failed:', err);
        if (active) setStatus('error');
      }
    }

    void run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPng = async () => {
    if (!svg) return;
    try {
      const pngDataUrl = await qrSvgToPngDataUrl(svg, 900);
      const link = document.createElement('a');
      link.download = `${fileName}-qr.png`;
      link.href = pngDataUrl;
      link.click();
    } catch (err) {
      console.error('QR PNG export failed:', err);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
      <div className="glass-panel modal-card qr-modal-card">
        <button className="control-btn qr-modal-close" onClick={onClose} title="Close">
          <X size={16} />
        </button>

        <QrCode size={28} className="modal-icon" style={{ color: 'var(--accent-purple)' }} />
        <h3 id="qr-modal-title" className="modal-title">Scan to Share</h3>

        {status === 'loading' && (
          <div className="qr-status-row">
            <Loader2 size={20} className="qr-spin" />
            <span>Packing your photo into a QR code…</span>
          </div>
        )}

        {status === 'error' && (
          <>
            <div className="qr-status-row">
              <TriangleAlert size={20} style={{ color: 'var(--error)' }} />
              <span>Couldn't fit this photo into a QR code.</span>
            </div>
            <p className="modal-desc">
              Try Download or Share instead — those send the full-quality image.
            </p>
          </>
        )}

        {status === 'ready' && svg && (
          <>
            <p className="modal-desc">
              This code has your photo baked right into it — no internet, app, or account
              needed to view it. Let someone scan it off your screen, or print it out.
            </p>
            <div className="qr-code-frame" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="modal-desc" style={{ fontSize: '12px' }}>
              Since there's no server involved, the embedded preview is small and a little
              soft — great for a quick look, not a replacement for the full download.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>Close</button>
              <button className="btn-primary" onClick={handleDownloadPng}>
                <Download size={16} /> Download QR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
