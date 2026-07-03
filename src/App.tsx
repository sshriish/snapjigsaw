import { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Trophy, ShieldCheck } from 'lucide-react';
import { CameraCapture } from './components/CameraCapture';
import { JigsawPuzzle } from './components/JigsawPuzzle';
import { PolaroidChoice } from './components/PolaroidChoice';
import { PolaroidReveal } from './components/PolaroidReveal';
import { PolaroidWall } from './components/PolaroidWall';
import { IntroSplash } from './components/IntroSplash';
import { FloralCorners } from './components/FloralCorners';
import { enhanceImage } from './utils/imageEnhance';
import './App.css';

// Show the teddy-bear intro once per browser session, not on every screen
// change/reload within the same visit.
const INTRO_SESSION_KEY = 'snapjigsaw_intro_seen';

type Screen = 'LANDING' | 'CAPTURE' | 'PUZZLE' | 'CHOICE' | 'REVEAL' | 'WALL';

// How many recently-solved photos we keep around as merge candidates.
const MAX_PHOTO_HISTORY = 3;

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

function App() {
  // Whether the teddy-bear polaroid intro is still playing. Skipped on
  // repeat visits within the same browser session.
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(INTRO_SESSION_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    } catch {
      // Ignore — worst case the intro replays next time.
    }
    setShowIntro(false);
  };

  // Screen and Flow States
  const [screen, setScreen] = useState<Screen>('LANDING');
  const [filteredPhoto, setFilteredPhoto] = useState<string | null>(null);

  // Recently solved photos, newest first (max MAX_PHOTO_HISTORY), used to let
  // the player pick single vs. merged polaroids on the choice screen.
  const [photoHistory, setPhotoHistory] = useState<string[]>([]);
  // The 1-3 photos the player picked on the choice screen to send to REVEAL.
  const [photosForReveal, setPhotosForReveal] = useState<string[]>([]);

  // Game Settings States
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [rotationMode, setRotationMode] = useState<boolean>(false);

  // Stats and Achievements States
  const [streakCount, setStreakCount] = useState<number>(0);
  const [hasDiscardedInStreak, setHasDiscardedInStreak] = useState<boolean>(false);
  const [polaroids, setPolaroids] = useState<Polaroid[]>([]);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  // Load the streak from localStorage
  useEffect(() => {
    try {
      const storedStreak = localStorage.getItem('snapjigsaw_streak');
      if (storedStreak) {
        setStreakCount(parseInt(storedStreak, 10));
      }
    } catch (err) {
      console.error('Failed to load saved streak from localStorage:', err);
    }
  }, []);

  // Load polaroids from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('snapjigsaw_polaroids');
      if (stored) {
        setPolaroids(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load saved polaroids from localStorage:', err);
    }
  }, []);

  // Save state helpers
  const saveLocalPolaroids = (updated: Polaroid[]) => {
    setPolaroids(updated);
    localStorage.setItem('snapjigsaw_polaroids', JSON.stringify(updated));
  };

  const updateStreak = (newStreak: number) => {
    setStreakCount(newStreak);
    localStorage.setItem('snapjigsaw_streak', newStreak.toString());
  };

  // Handlers for App Navigation Flow
  // The camera screen now handles filter selection live, before the shutter
  // fires, so the captured photo already has the chosen look baked in.
  const handlePhotoCaptured = async (photo: string) => {
    setIsEnhancing(true);
    try {
      // Boost quality: upscale + denoise + sharpen + auto-contrast
      const enhanced = await enhanceImage(photo);
      setFilteredPhoto(enhanced);
    } catch (err) {
      console.error('Photo enhancement failed, using original capture', err);
      setFilteredPhoto(photo);
    } finally {
      setIsEnhancing(false);
      setScreen('PUZZLE');
    }
  };

  const handlePuzzleSolved = () => {
    if (!filteredPhoto) return;

    updateStreak(streakCount + 1);
    setPhotoHistory((prev) => [filteredPhoto, ...prev].slice(0, MAX_PHOTO_HISTORY));
    setScreen('CHOICE');
  };

  const handleDiscard = () => {
    setHasDiscardedInStreak(true);
    setFilteredPhoto(null);
    setScreen('CAPTURE');
  };

  // From the CHOICE screen: turn the newest solved photo into a polaroid.
  const handleChooseSingle = () => {
    if (photoHistory.length === 0) return;
    setPhotosForReveal([photoHistory[0]]);
    setScreen('REVEAL');
  };

  // From the CHOICE screen: merge the last 2 or 3 solved photos into one collage polaroid.
  const handleChooseMerge = (count: 2 | 3) => {
    if (photoHistory.length < count) return;
    setPhotosForReveal(photoHistory.slice(0, count));
    setScreen('REVEAL');
  };

  // From the CHOICE screen: skip making a polaroid for now and solve another puzzle,
  // keeping the streak and photo history intact.
  const handlePlayAgainFromChoice = () => {
    setFilteredPhoto(null);
    setScreen('CAPTURE');
  };

  const handlePolaroidSaved = (newPolaroid: Polaroid) => {
    saveLocalPolaroids([newPolaroid, ...polaroids]);

    updateStreak(0);
    setHasDiscardedInStreak(false);
    setPhotoHistory([]);
    setPhotosForReveal([]);
    setFilteredPhoto(null);

    setScreen('WALL');
  };

  const handleDeletePolaroid = (id: string) => {
    saveLocalPolaroids(polaroids.filter((p) => p.id !== id));
  };

  const handleStartCapture = () => {
    setScreen('CAPTURE');
  };

  const totalPolaroids = polaroids.length;
  const isHardUnlocked = totalPolaroids >= 3;

  return (
    <>
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
      {isEnhancing && (
        <div className="enhance-overlay" role="status" aria-live="polite">
          <div className="enhance-spinner" />
          <p>Enhancing your photo…</p>
        </div>
      )}
      <FloralCorners />
      <div className="app-container">
      <header className="app-header">
        <div className="app-title-wrapper" onClick={() => setScreen('LANDING')} style={{ cursor: 'pointer' }}>
          <Sparkles className="app-logo" size={24} />
          <div>
            <h1 className="app-title">SnapJigsaw</h1>
            <p className="app-subtitle">Selfies Turned Solving Fun</p>
          </div>
        </div>

        <div className="header-actions">
          {screen !== 'WALL' && (
            <button className="btn-secondary" onClick={() => setScreen('WALL')}>
              <ImageIcon size={16} /> Gallery Wall ({totalPolaroids})
            </button>
          )}
          {streakCount > 0 && screen !== 'REVEAL' && (
            <div className="btn-secondary" style={{ borderColor: 'var(--accent-purple)', cursor: 'default' }}>
              <Trophy size={16} className="app-logo" /> Streak: {streakCount}
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {screen === 'LANDING' && (
          <div className="glass-panel landing-card">
            <div className="privacy-badge">
              <ShieldCheck size={14} /> 100% Client-Side. Your photos stay on your device.
            </div>

            <h2 className="landing-title">Snap, Solve &amp; Collect</h2>
            <p className="landing-desc">
              Pick a vintage analog filter, snap your photo already styled, and solve the generated jigsaw puzzle.
              After every solve, it's your call: develop a polaroid right away, merge your last 2 or 3 photos
              into one collage card, or keep solving before you decide!
            </p>

            <div className="settings-section">
              <span className="settings-label">1. Choose Difficulty</span>
              <div className="difficulty-grid">
                <button
                  className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  <span className="difficulty-name">Easy</span>
                  <span className="difficulty-desc">3x3 (9 pieces)</span>
                </button>
                <button
                  className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  <span className="difficulty-name">Normal</span>
                  <span className="difficulty-desc">4x4 (16 pieces)</span>
                </button>
                <button
                  className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''} ${!isHardUnlocked ? 'locked' : ''}`}
                  onClick={() => isHardUnlocked && setDifficulty('hard')}
                  title={!isHardUnlocked ? 'Earn 3 polaroids to unlock 5x5 Grid' : ''}
                >
                  <span className="difficulty-name">Hard</span>
                  <span className="difficulty-desc">
                    {!isHardUnlocked ? 'Earn 3 Polaroids' : '5x5 (25 pieces)'}
                  </span>
                </button>
              </div>

              <div className="toggle-setting">
                <div className="toggle-setting-info">
                  <span className="toggle-setting-name">Rotation Mode</span>
                  <span className="toggle-setting-desc">Pieces start rotated and must be oriented correctly</span>
                </div>
                <button
                  className={`switch-btn ${rotationMode ? 'active' : ''}`}
                  onClick={() => setRotationMode(!rotationMode)}
                >
                  <div className="switch-thumb" />
                </button>
              </div>
            </div>

            <button className="btn-primary" onClick={handleStartCapture}>
              <Camera size={20} /> Open Camera
            </button>
          </div>
        )}

        {screen === 'CAPTURE' && (
          <CameraCapture
            onCapture={handlePhotoCaptured}
            onBack={() => setScreen('LANDING')}
          />
        )}

        {screen === 'PUZZLE' && filteredPhoto && (
          <JigsawPuzzle
            photoDataUrl={filteredPhoto}
            difficulty={difficulty}
            rotationMode={rotationMode}
            attemptNumber={streakCount + 1}
            streakCount={streakCount}
            onSolveComplete={handlePuzzleSolved}
            onDiscard={handleDiscard}
          />
        )}

        {screen === 'CHOICE' && (
          <PolaroidChoice
            photoHistory={photoHistory}
            streakCount={streakCount}
            onSelectSingle={handleChooseSingle}
            onSelectMerge={handleChooseMerge}
            onPlayAgain={handlePlayAgainFromChoice}
          />
        )}

        {screen === 'REVEAL' && photosForReveal.length > 0 && (
          <PolaroidReveal
            photos={photosForReveal}
            totalPolaroidsCount={totalPolaroids}
            perfectStreak={!hasDiscardedInStreak}
            onSave={handlePolaroidSaved}
            onCancel={() => setScreen('CHOICE')}
          />
        )}

        {screen === 'WALL' && (
          <PolaroidWall
            polaroids={polaroids}
            onDelete={handleDeletePolaroid}
            onBack={() => setScreen('LANDING')}
          />
        )}
      </main>
      </div>
    </>
  );
}

export default App;
