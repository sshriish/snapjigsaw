// Puzzle helper functions (slicing, shuffling, validation)

export interface PuzzlePiece {
  id: number;          // Original position index (0 to gridCount-1)
  correctIndex: number;// Original position index (same as id, for readability)
  currentIndex: number;// Current position on the board
  rotation: number;    // 0, 90, 180, 270 degrees
  dataUrl: string;     // Image slice data URL
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_SETTINGS = {
  easy: { grid: 3, label: 'Easy (3x3)', threshold: 0 },
  medium: { grid: 4, label: 'Medium (4x4)', threshold: 0 }, // unlocked initially
  hard: { grid: 5, label: 'Hard (5x5)', threshold: 3 }      // unlocks after 3 polaroids
};

/**
 * Slices an image into grid pieces and returns puzzle piece models.
 */
export async function createPuzzlePieces(
  imageSrc: string,
  gridSize: number,
  rotationMode: boolean
): Promise<PuzzlePiece[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      try {
        const pieces: PuzzlePiece[] = [];
        
        // We will crop/fit the source image to a square for a clean jigsaw puzzle look
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const startX = (img.naturalWidth - minDim) / 2;
        const startY = (img.naturalHeight - minDim) / 2;

        const pieceSize = minDim / gridSize;

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;

            // Create offscreen canvas for this slice
            const canvas = document.createElement('canvas');
            canvas.width = 160; // Fixed size for piece graphics to keep it normalized
            canvas.height = 160;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error('Failed to get 2d context for puzzle slice');

            // Draw portion of source image onto slice canvas
            ctx.drawImage(
              img,
              startX + col * pieceSize,
              startY + row * pieceSize,
              pieceSize,
              pieceSize,
              0,
              0,
              160,
              160
            );

            // Determine initial rotation (if rotationMode is on, randomize. Else 0)
            const rotation = rotationMode
              ? [0, 90, 180, 270][Math.floor(Math.random() * 4)]
              : 0;

            pieces.push({
              id: index,
              correctIndex: index,
              currentIndex: index, // will be scrambled next
              rotation,
              dataUrl: canvas.toDataURL('image/jpeg', 0.9)
            });
          }
        }
        resolve(pieces);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);
  });
}

/**
 * Scrambles the current indices of the puzzle pieces.
 * Ensures that the scrambled state is NOT already solved.
 */
export function scramblePieces(pieces: PuzzlePiece[], rotationMode: boolean): PuzzlePiece[] {
  // Clone each piece object too, not just the array — a shallow `[...pieces]`
  // copy still shares the underlying piece references, so mutating
  // `currentIndex`/`rotation` below would silently corrupt the caller's data.
  const scrambled = pieces.map((piece) => ({ ...piece }));
  let isSolved = true;

  while (isSolved) {
    // Fisher-Yates Shuffle
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = scrambled[i].currentIndex;
      scrambled[i].currentIndex = scrambled[j].currentIndex;
      scrambled[j].currentIndex = temp;
    }

    // Assign randomized rotations if mode is active
    if (rotationMode) {
      scrambled.forEach((piece) => {
        piece.rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      });
    }

    // Check if it's solved
    isSolved = checkIsSolved(scrambled);
  }

  return scrambled;
}

/**
 * Checks if all pieces are in their correct slots and correctly rotated.
 */
export function checkIsSolved(pieces: PuzzlePiece[]): boolean {
  return pieces.every((piece) => piece.currentIndex === piece.id && piece.rotation === 0);
}
