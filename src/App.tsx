import { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Trophy, ShieldCheck } from 'lucide-react';
import { CameraCapture } from './components/CameraCapture';
import { FilterSelector } from './components/FilterSelector';
import { JigsawPuzzle } from './components/JigsawPuzzle';
import { PolaroidReveal } from './components/PolaroidReveal';
import { PolaroidWall } from './components/PolaroidWall';
import type { FilterType } from './utils/imageFilters';
import './App.css';

type Screen = 'LANDING' | 'CAPTURE' | 'FILTER' | 'PUZZLE' | 'REVEAL' | 'WALL';

interface Polaroid {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
  frameStyle: string;
}

function App() {
  // Screen and Flow States
  const [screen, setScreen] = useState<Screen>('LANDING');
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [filteredPhoto, setFilteredPhoto] = useState<string | null>(null);

  // Game Settings States
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [rotationMode, setRotationMode] = useState<boolean>(false);

  // Stats and Achievements States
  const [streakCount, setStreakCount] = useState<number>(0);
  const [hasDiscardedInStreak, setHasDiscardedInStreak] = useState<boolean>(false);
  const [polaroids, setPolaroids] = useState<Polaroid[]>([]);

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
  const handlePhotoCaptured = (photo: string) => {
    setRawPhoto(photo);
    setScreen('FILTER');
  };

  const handleFilterApplied = (filteredPhotoUrl: string, _filter: FilterType) => {
    setFilteredPhoto(filteredPhotoUrl);
    setScreen('PUZZLE');
  };

  const handlePuzzleSolved = () => {
    const nextStreak = streakCount + 1;
    
    if (nextStreak >= 3) {
      setScreen('REVEAL');
    } else {
      updateStreak(nextStreak);
      setScreen('LANDING');
    }
  };

  const handleDiscard = () => {
    setHasDiscardedInStreak(true);
    setRawPhoto(null);
    setFilteredPhoto(null);
    setScreen('CAPTURE');
  };

  const handlePolaroidSaved = (newPolaroid: Polaroid) => {
    saveLocalPolaroids([newPolaroid, ...polaroids]);

    updateStreak(0);
    setHasDiscardedInStreak(false);

    setRawPhoto(null);
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
              <Trophy size={16} className="app-logo" /> Streak: {streakCount}/3
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
              Capture a photo, apply vintage analog filters, and solve the generated jigsaw puzzle. 
              Assemble 3 puzzles in a row to develop a customized digital polaroid for your gallery wall!
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

        {screen === 'FILTER' && rawPhoto && (
          <FilterSelector
            photoDataUrl={rawPhoto}
            onFilterSelected={handleFilterApplied}
            onCancel={() => setScreen('CAPTURE')}
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

        {screen === 'REVEAL' && filteredPhoto && (
          <PolaroidReveal
            photoDataUrl={filteredPhoto}
            totalPolaroidsCount={totalPolaroids}
            perfectStreak={!hasDiscardedInStreak}
            onSave={handlePolaroidSaved}
            onCancel={() => setScreen('LANDING')}
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
  );
}

export default App;
