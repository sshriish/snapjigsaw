import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, RotateCw, Trash2, ArrowRight, Award, Trophy, Timer } from 'lucide-react';
import { createPuzzlePieces, scramblePieces, checkIsSolved } from '../utils/puzzleHelper';
import type { PuzzlePiece } from '../utils/puzzleHelper';
import { playSnap } from '../utils/soundHelper';
import confetti from 'canvas-confetti';

interface JigsawPuzzleProps {
  photoDataUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rotationMode: boolean;
  attemptNumber: number;
  streakCount: number;
  onSolveComplete: () => void;
  onDiscard: () => void;
}

export const JigsawPuzzle: React.FC<JigsawPuzzleProps> = ({
  photoDataUrl,
  difficulty,
  rotationMode,
  attemptNumber,
  streakCount,
  onSolveComplete,
  onDiscard
}) => {
  const gridSize = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showGhost, setShowGhost] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [isWin, setIsWin] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<number | null>(null);
  const ghostTimeoutRef = useRef<number | null>(null);

  // Initialize and slice puzzle
  useEffect(() => {
    async function initPuzzle() {
      const initialPieces = await createPuzzlePieces(photoDataUrl, gridSize, rotationMode);
      const scrambled = scramblePieces(initialPieces, rotationMode);
      setPieces(scrambled);
      setHasStarted(true);
      setIsWin(false);
      setElapsedTime(0);
      
      // Auto ghost fading sequence on start
      setGhostOpacity(0.35);
      triggerGhostFade();
    }
    initPuzzle();

    return () => {
      stopTimer();
      clearGhostTimeout();
    };
  }, [photoDataUrl, gridSize, rotationMode]);

  // Stopwatch timer logic
  useEffect(() => {
    if (hasStarted && !isWin) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => stopTimer();
  }, [hasStarted, isWin]);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearGhostTimeout = () => {
    if (ghostTimeoutRef.current !== null) {
      clearTimeout(ghostTimeoutRef.current);
      ghostTimeoutRef.current = null;
    }
  };

  const triggerGhostFade = () => {
    clearGhostTimeout();
    ghostTimeoutRef.current = window.setTimeout(() => {
      setGhostOpacity(0);
    }, 4000); // Fades out fully after 4 seconds
  };

  const toggleGhost = () => {
    if (showGhost) {
      setShowGhost(false);
      setGhostOpacity(0);
    } else {
      setShowGhost(true);
      setGhostOpacity(0.35);
      triggerGhostFade();
    }
  };

  // Format seconds into MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Core Puzzle Interaction: Swapping and Rotating
  const handlePieceInteraction = (clickedPieceId: number) => {
    if (isWin) return;

    const clickedPiece = pieces.find((p) => p.id === clickedPieceId);
    if (!clickedPiece) return;

    // Don't interact with already locked correct pieces
    if (clickedPiece.currentIndex === clickedPiece.id && clickedPiece.rotation === 0) {
      return;
    }

    if (selectedPieceId === null) {
      // First selection
      setSelectedPieceId(clickedPieceId);
    } else if (selectedPieceId === clickedPieceId) {
      // Tapping the same selected piece rotates it if rotation mode is active
      if (rotationMode) {
        rotatePiece(clickedPieceId);
      } else {
        setSelectedPieceId(null);
      }
    } else {
      // Tapping a different piece: Swap positions
      swapPieces(selectedPieceId, clickedPieceId);
      setSelectedPieceId(null);
    }
  };

  // Perform rotation
  const rotatePiece = (pieceId: number) => {
    setPieces((prevPieces) => {
      const updated = prevPieces.map((piece) => {
        if (piece.id === pieceId) {
          const newRotation = (piece.rotation + 90) % 360;
          
          // Check snap feedback
          if (piece.currentIndex === piece.id && newRotation === 0) {
            triggerLockEffects();
          }

          return { ...piece, rotation: newRotation };
        }
        return piece;
      });

      checkSolvedState(updated);
      return updated;
    });
  };

  // Perform swap
  const swapPieces = (idA: number, idB: number) => {
    setPieces((prevPieces) => {
      const pieceA = prevPieces.find((p) => p.id === idA);
      const pieceB = prevPieces.find((p) => p.id === idB);

      if (!pieceA || !pieceB) return prevPieces;

      const idxA = pieceA.currentIndex;
      const idxB = pieceB.currentIndex;

      const updated = prevPieces.map((piece) => {
        if (piece.id === idA) {
          const newIdx = idxB;
          // Trigger snap effects if it drops into correct slot
          if (newIdx === piece.id && piece.rotation === 0) {
            triggerLockEffects();
          }
          return { ...piece, currentIndex: newIdx };
        }
        if (piece.id === idB) {
          const newIdx = idxA;
          if (newIdx === piece.id && piece.rotation === 0) {
            triggerLockEffects();
          }
          return { ...piece, currentIndex: newIdx };
        }
        return piece;
      });

      checkSolvedState(updated);
      return updated;
    });
  };

  const triggerLockEffects = () => {
    playSnap();
    if (navigator.vibrate) {
      navigator.vibrate(60);
    }
  };

  const checkSolvedState = (currentPieces: PuzzlePiece[]) => {
    if (checkIsSolved(currentPieces)) {
      setIsWin(true);
      stopTimer();
      
      // Fire confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // HTML5 Drag and Drop for Desktop mouse support
  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    const piece = pieces.find((p) => p.id === pieceId);
    // Don't drag locked pieces
    if (piece && piece.currentIndex === piece.id && piece.rotation === 0) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', pieceId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetPieceId: number) => {
    e.preventDefault();
    const sourceIdStr = e.dataTransfer.getData('text/plain');
    if (!sourceIdStr) return;

    const sourceId = parseInt(sourceIdStr, 10);
    if (sourceId === targetPieceId) return;

    // Check if target is locked
    const targetPiece = pieces.find((p) => p.id === targetPieceId);
    if (targetPiece && targetPiece.currentIndex === targetPiece.id && targetPiece.rotation === 0) {
      return; // can't drop/swap onto a locked piece
    }

    swapPieces(sourceId, targetPieceId);
  };

  const handleManualRotateClick = (e: React.MouseEvent, pieceId: number) => {
    e.stopPropagation(); // prevent triggering piece select/swap
    rotatePiece(pieceId);
  };

  // Map out scrambled slots array to render grid in actual UI order
  const sortedPiecesToRender = [...pieces].sort((a, b) => a.currentIndex - b.currentIndex);

  return (
    <div className="glass-panel puzzle-card">
      {/* Top Status Bar */}
      <div className="puzzle-status-bar">
        <div className="status-item">
          <Award size={18} />
          <span>Attempt: <span className="status-value">{attemptNumber} of 3</span></span>
        </div>
        <div className="status-item">
          <Trophy size={18} />
          <span>Streak: <span className="status-value">{streakCount} of 3</span></span>
        </div>
        <div className="status-item">
          <Timer size={18} />
          <span className="status-timer">{formatTime(elapsedTime)}</span>
        </div>
        <div className="status-controls">
          <button
            className={`control-btn ${showGhost ? 'active' : ''}`}
            onClick={toggleGhost}
            title="Toggle Ghost Preview"
          >
            {showGhost ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>

      {/* Main Board */}
      <div className="puzzle-board-wrapper">
        <div
          className="puzzle-board-container"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {/* Fading Ghost Preview */}
          {showGhost && (
            <img
              src={photoDataUrl}
              alt="Ghost preview"
              className="ghost-preview-image"
              style={{ opacity: ghostOpacity }}
            />
          )}

          {/* Scrambled puzzle pieces */}
          <div
            className="puzzle-grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
          >
            {sortedPiecesToRender.map((piece) => {
              const isLocked = piece.currentIndex === piece.id && piece.rotation === 0;
              const isSelected = selectedPieceId === piece.id;

              return (
                <div
                  key={piece.id}
                  className="puzzle-slot"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, piece.id)}
                >
                  <div
                    draggable={!isLocked}
                    onDragStart={(e) => handleDragStart(e, piece.id)}
                    onClick={() => handlePieceInteraction(piece.id)}
                    className={`puzzle-piece ${isSelected ? 'selected' : ''} ${isLocked ? 'correct-locked' : ''}`}
                    style={{
                      backgroundImage: `url(${piece.dataUrl})`,
                      transform: `rotate(${piece.rotation}deg)`
                    }}
                  >
                    {/* Snap flash confirmation overlay */}
                    {isLocked && (
                      <div className="piece-correct-overlay" />
                    )}

                    {/* Manual Rotate icon overlay for mouse users when rotation is active */}
                    {rotationMode && !isLocked && (
                      <button
                        className="control-btn"
                        onClick={(e) => handleManualRotateClick(e, piece.id)}
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          color: '#fff'
                        }}
                        title="Rotate 90°"
                      >
                        <RotateCw size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="puzzle-footer">
        <button className="btn-danger" onClick={onDiscard}>
          <Trash2 size={16} /> Discard & Start Over
        </button>

        {isWin && (
          <button className="btn-primary" onClick={onSolveComplete}>
            Proceed to Reveal <ArrowRight size={18} />
          </button>
        )}
      </div>

      {/* Solving Instructions */}
      <div className="camera-instructions" style={{ justifyContent: 'center' }}>
        <span className="app-subtitle" style={{ textAlign: 'center' }}>
          {rotationMode
            ? "Desktop: Drag to swap, Click to rotate | Mobile: Tap to select/swap, Tap selected to rotate"
            : "Desktop: Drag to swap | Mobile: Tap one piece, then another to swap"}
        </span>
      </div>
    </div>
  );
};
