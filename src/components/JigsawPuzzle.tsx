import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, RotateCw, Trash2, ArrowRight, Award, Trophy, Timer, Undo2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
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
  const [history, setHistory] = useState<PuzzlePiece[][]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showGhost, setShowGhost] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [showReference, setShowReference] = useState(true);
  const [referenceExpanded, setReferenceExpanded] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const timerRef = useRef<number | null>(null);
  const ghostTimeoutRef = useRef<number | null>(null);
  // Indexed by grid slot (currentIndex), so arrow-key navigation can jump
  // straight to the DOM node occupying an adjacent slot.
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const MAX_HISTORY = 20;

  // Initialize and slice puzzle
  useEffect(() => {
    async function initPuzzle() {
      const initialPieces = await createPuzzlePieces(photoDataUrl, gridSize, rotationMode);
      const scrambled = scramblePieces(initialPieces, rotationMode);
      setPieces(scrambled);
      setHistory([]);
      setSelectedPieceId(null);
      setHasStarted(true);
      setIsWin(false);
      setElapsedTime(0);
      
      // Auto ghost fading sequence on start
      setGhostOpacity(0.35);
      triggerGhostFade();
    }
    void initPuzzle();

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
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), pieces]);
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
    setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), pieces]);
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

  const undoLastMove = () => {
    if (history.length === 0 || isWin) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPieces(previous);
    setSelectedPieceId(null);
  };

  const lockedCount = pieces.filter(
    (p) => p.currentIndex === p.id && p.rotation === 0
  ).length;
  const totalPieces = gridSize * gridSize;

  const requestDiscard = () => {
    // A near-complete puzzle is easy to lose with a stray tap — confirm first.
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    onDiscard();
  };

  const checkSolvedState = (currentPieces: PuzzlePiece[]) => {
    if (checkIsSolved(currentPieces)) {
      setIsWin(true);
      stopTimer();
      
      // Fire confetti celebration
      void confetti({
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

  // Keyboard support: arrow keys move focus across the grid, Enter/Space
  // selects or swaps the focused piece, and "r" rotates the currently
  // selected piece when rotation mode is active.
  const handlePieceKeyDown = (e: React.KeyboardEvent, piece: PuzzlePiece) => {
    const { key } = e;
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    if (arrowKeys.includes(key)) {
      e.preventDefault();
      const row = Math.floor(piece.currentIndex / gridSize);
      const col = piece.currentIndex % gridSize;
      let targetRow = row;
      let targetCol = col;

      if (key === 'ArrowUp') targetRow = Math.max(0, row - 1);
      if (key === 'ArrowDown') targetRow = Math.min(gridSize - 1, row + 1);
      if (key === 'ArrowLeft') targetCol = Math.max(0, col - 1);
      if (key === 'ArrowRight') targetCol = Math.min(gridSize - 1, col + 1);

      const targetIndex = targetRow * gridSize + targetCol;
      slotRefs.current[targetIndex]?.focus();
      return;
    }

    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      handlePieceInteraction(piece.id);
      return;
    }

    if ((key === 'r' || key === 'R') && rotationMode && selectedPieceId === piece.id) {
      e.preventDefault();
      rotatePiece(piece.id);
    }
  };

  // Map out scrambled slots array to render grid in actual UI order
  const sortedPiecesToRender = [...pieces].sort((a, b) => a.currentIndex - b.currentIndex);

  return (
    <div className="glass-panel puzzle-card">
      {/* Top Status Bar */}
      <div className="puzzle-status-bar">
        <div className="status-item">
          <Award size={18} />
          <span>Attempt: <span className="status-value">#{attemptNumber}</span></span>
        </div>
        <div className="status-item">
          <Trophy size={18} />
          <span>Streak: <span className="status-value">{streakCount}</span></span>
        </div>
        <div className="status-item">
          <Timer size={18} />
          <span className="status-timer">{formatTime(elapsedTime)}</span>
        </div>
        <div className="status-controls">
          <button
            className="control-btn"
            onClick={undoLastMove}
            disabled={history.length === 0 || isWin}
            title="Undo Last Move"
          >
            <Undo2 size={18} />
          </button>
          <button
            className={`control-btn ${showGhost ? 'active' : ''}`}
            onClick={toggleGhost}
            title="Toggle Ghost Preview"
          >
            {showGhost ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            className={`control-btn ${showReference ? 'active' : ''}`}
            onClick={() => {
              setShowReference((prev) => !prev);
              setReferenceExpanded(false);
            }}
            title="Toggle Reference Photo"
          >
            <ImageIcon size={18} />
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="puzzle-progress" aria-live="polite">
        <span className="puzzle-progress-label">
          {isWin ? 'Solved!' : `${lockedCount} / ${totalPieces} pieces placed`}
        </span>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${totalPieces === 0 ? 0 : (lockedCount / totalPieces) * 100}%` }}
          />
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
                    ref={(el) => {
                      slotRefs.current[piece.currentIndex] = el;
                    }}
                    draggable={!isLocked}
                    onDragStart={(e) => handleDragStart(e, piece.id)}
                    onClick={() => handlePieceInteraction(piece.id)}
                    onKeyDown={(e) => handlePieceKeyDown(e, piece)}
                    role="button"
                    tabIndex={isLocked ? -1 : 0}
                    aria-label={
                      isLocked
                        ? `Piece ${piece.id + 1}, correctly placed`
                        : `Piece ${piece.id + 1}${isSelected ? ', selected' : ''}`
                    }
                    aria-pressed={isSelected}
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

      {/* Persistent reference thumbnail — the original, uncropped photo,
          always fully visible (unlike the fading ghost overlay) so the
          player can check it at any point while solving. Sits outside the
          puzzle board, pinned to the bottom-left of the screen. */}
      {showReference && (
        <button
          type="button"
          className={`reference-thumb ${referenceExpanded ? 'expanded' : ''}`}
          onClick={() => setReferenceExpanded((prev) => !prev)}
          title={referenceExpanded ? 'Shrink reference photo' : 'Expand reference photo'}
        >
          <span className="reference-thumb-label">Reference</span>
          <img src={photoDataUrl} alt="Original photo reference" />
        </button>
      )}

      {/* Action Footer */}
      <div className="puzzle-footer">
        <button className="btn-danger" onClick={requestDiscard}>
          <Trash2 size={16} /> Discard & Start Over
        </button>

         {isWin && (
          <button className="btn-primary" onClick={onSolveComplete}>
            Continue <ArrowRight size={18} />
          </button>
        )}
      </div>

      {/* Solving Instructions */}
      <div className="camera-instructions" style={{ justifyContent: 'center' }}>
        <span className="app-subtitle" style={{ textAlign: 'center' }}>
          {rotationMode
            ? "Desktop: Drag to swap, Click to rotate | Mobile: Tap to select/swap, Tap selected to rotate | Keyboard: Arrows to move, Enter to select/swap, R to rotate"
            : "Desktop: Drag to swap | Mobile: Tap one piece, then another to swap | Keyboard: Arrows to move, Enter to select/swap"}
          {' '}Tap the reference photo in the bottom-left to enlarge it anytime.
        </span>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="discard-modal-title">
          <div className="glass-panel modal-card">
            <AlertTriangle size={28} className="modal-icon" />
            <h3 id="discard-modal-title" className="modal-title">Discard this puzzle?</h3>
            <p className="modal-desc">
              {lockedCount > 0
                ? `You've placed ${lockedCount} of ${totalPieces} pieces correctly. Discarding restarts with a new photo — your streak is safe, but this progress will be lost.`
                : "This restarts with a new photo. Your streak is safe either way."}
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDiscardConfirm(false)}>
                Keep Solving
              </button>
              <button className="btn-danger" onClick={confirmDiscard}>
                <Trash2 size={16} /> Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
