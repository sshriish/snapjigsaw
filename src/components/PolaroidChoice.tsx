import React from 'react';
import { Image as ImageIcon, Layers, RefreshCw, Trophy } from 'lucide-react';

interface PolaroidChoiceProps {
  // Newest-first, capped at 3 by the caller
  photoHistory: string[];
  streakCount: number;
  onSelectSingle: () => void;
  onSelectMerge: (count: 2 | 3) => void;
  onPlayAgain: () => void;
}

export const PolaroidChoice: React.FC<PolaroidChoiceProps> = ({
  photoHistory,
  streakCount,
  onSelectSingle,
  onSelectMerge,
  onPlayAgain
}) => {
  const canMergeTwo = photoHistory.length >= 2;
  const canMergeThree = photoHistory.length >= 3;

  return (
    <div className="glass-panel landing-card">
      <div className="privacy-badge" style={{ borderColor: 'var(--accent-purple)' }}>
        <Trophy size={14} /> Puzzle Solved! Streak: {streakCount}
      </div>

      <h2 className="landing-title">What's next?</h2>
      <p className="landing-desc">
        Turn this photo into a polaroid now, merge it with your recent shots into one collage
        card, or keep the streak going and solve another puzzle first.
      </p>

      {/* Recent photo thumbnails */}
      <div className="choice-thumbs-row">
        {photoHistory.map((photo, i) => (
          <div key={i} className={`choice-thumb ${i === 0 ? 'newest' : ''}`}>
            <img src={photo} alt={`Solved photo ${i + 1}`} />
            <span className="choice-thumb-label">{i === 0 ? 'Newest' : `${i + 1} back`}</span>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <span className="settings-label">Choose an option</span>

        <div className="choice-options-grid">
          <button className="choice-option-btn" onClick={onSelectSingle}>
            <ImageIcon size={22} />
            <span className="choice-option-name">Make a Polaroid</span>
            <span className="choice-option-desc">Use just this newest photo</span>
          </button>

          <button
            className="choice-option-btn"
            disabled={!canMergeTwo}
            onClick={() => canMergeTwo && onSelectMerge(2)}
            title={!canMergeTwo ? 'Solve one more puzzle to unlock' : ''}
          >
            <Layers size={22} />
            <span className="choice-option-name">Merge Last 2</span>
            <span className="choice-option-desc">
              {canMergeTwo ? 'Combine your last 2 photos' : 'Needs 2 solved photos'}
            </span>
          </button>

          <button
            className="choice-option-btn"
            disabled={!canMergeThree}
            onClick={() => canMergeThree && onSelectMerge(3)}
            title={!canMergeThree ? 'Solve more puzzles to unlock' : ''}
          >
            <Layers size={22} />
            <span className="choice-option-name">Merge Last 3</span>
            <span className="choice-option-desc">
              {canMergeThree ? 'Combine your last 3 photos' : 'Needs 3 solved photos'}
            </span>
          </button>
        </div>
      </div>

      <button className="btn-primary" onClick={onPlayAgain}>
        <RefreshCw size={20} /> Play Again First
      </button>
    </div>
  );
};
