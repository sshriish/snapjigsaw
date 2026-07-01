import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, ImageOff } from 'lucide-react';
import { fetchSharedPolaroid, type SyncedPolaroid } from '../lib/polaroidSync';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const SharedPolaroidView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [polaroid, setPolaroid] = useState<SyncedPolaroid | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found' | 'error'>('loading');

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug || !isSupabaseConfigured) {
        setStatus('not-found');
        return;
      }
      try {
        const result = await fetchSharedPolaroid(slug);
        if (!active) return;
        setPolaroid(result);
        setStatus(result ? 'found' : 'not-found');
      } catch (err) {
        console.error('Failed to load shared polaroid:', err);
        if (active) setStatus('error');
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="app-title-wrapper" style={{ textDecoration: 'none' }}>
          <Sparkles className="app-logo" size={24} />
          <div>
            <h1 className="app-title">SnapJigsaw</h1>
            <p className="app-subtitle">Selfies Turned Solving Fun</p>
          </div>
        </Link>
      </header>

      <main className="app-main">
        {status === 'loading' && (
          <div className="glass-panel landing-card">
            <p className="landing-desc">Loading shared polaroid...</p>
          </div>
        )}

        {(status === 'not-found' || status === 'error') && (
          <div className="glass-panel empty-wall">
            <ImageOff className="empty-wall-icon" size={64} />
            <h3>{status === 'error' ? 'Something went wrong' : 'Polaroid not found'}</h3>
            <p className="app-subtitle" style={{ maxWidth: '340px' }}>
              This link may have expired, or the polaroid is no longer shared.
            </p>
            <Link to="/" className="btn-primary">
              <Sparkles size={18} /> Make Your Own
            </Link>
          </div>
        )}

        {status === 'found' && polaroid && (
          <div className="lightbox-content" style={{ position: 'static' }}>
            <div className={`polaroid-frame style-${polaroid.frameStyle}`} style={{ transform: 'none' }}>
              <div className="polaroid-image-container">
                <img
                  src={polaroid.imageUrl}
                  alt={polaroid.caption}
                  className="polaroid-photo developed"
                />
              </div>
              <div className="polaroid-info">
                <span className="polaroid-caption">{polaroid.caption}</span>
                <span className="polaroid-date">{polaroid.date}</span>
              </div>
            </div>

            <Link to="/" className="btn-primary" style={{ marginTop: '20px' }}>
              <Sparkles size={18} /> Snap &amp; Solve Your Own
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
