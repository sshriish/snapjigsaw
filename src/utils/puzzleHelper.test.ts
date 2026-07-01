import { describe, it, expect } from 'vitest';
import { scramblePieces, checkIsSolved, DIFFICULTY_SETTINGS } from './puzzleHelper';
import type { PuzzlePiece } from './puzzleHelper';

/** Builds a solved 3x3 (9-piece) board: every piece at its own index, no rotation. */
function buildSolvedBoard(count = 9): PuzzlePiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    correctIndex: i,
    currentIndex: i,
    rotation: 0,
    dataUrl: `data:piece-${i}`,
  }));
}

describe('checkIsSolved', () => {
  it('returns true when every piece is in its correct slot with no rotation', () => {
    expect(checkIsSolved(buildSolvedBoard())).toBe(true);
  });

  it('returns false when a single piece is out of place', () => {
    const board = buildSolvedBoard();
    // Swap piece 0 and piece 1's positions.
    board[0].currentIndex = 1;
    board[1].currentIndex = 0;
    expect(checkIsSolved(board)).toBe(false);
  });

  it('returns false when a piece is in the correct slot but rotated', () => {
    const board = buildSolvedBoard();
    board[0].rotation = 90;
    expect(checkIsSolved(board)).toBe(false);
  });

  it('treats an empty board as solved (vacuous truth)', () => {
    expect(checkIsSolved([])).toBe(true);
  });
});

describe('scramblePieces', () => {
  it('never returns an already-solved arrangement', () => {
    // Run many times since shuffling is random; a flaky implementation would
    // eventually leak a solved board across enough trials.
    for (let trial = 0; trial < 50; trial++) {
      const scrambled = scramblePieces(buildSolvedBoard(), false);
      expect(checkIsSolved(scrambled)).toBe(false);
    }
  });

  it('preserves the same set of pieces (no pieces lost, duplicated, or renamed)', () => {
    const original = buildSolvedBoard();
    const scrambled = scramblePieces(original, false);

    const originalIds = original.map((p) => p.id).sort((a, b) => a - b);
    const scrambledIds = scrambled.map((p) => p.id).sort((a, b) => a - b);
    expect(scrambledIds).toEqual(originalIds);

    const currentIndices = scrambled.map((p) => p.currentIndex).sort((a, b) => a - b);
    expect(currentIndices).toEqual(originalIds);
  });

  it('does not mutate the input array passed in', () => {
    const original = buildSolvedBoard();
    const originalSnapshot = original.map((p) => ({ ...p }));
    scramblePieces(original, false);
    expect(original).toEqual(originalSnapshot);
  });

  it('leaves rotation at 0 for every piece when rotationMode is false', () => {
    const scrambled = scramblePieces(buildSolvedBoard(), false);
    expect(scrambled.every((p) => p.rotation === 0)).toBe(true);
  });

  it('assigns each piece a rotation from the valid set when rotationMode is true', () => {
    const scrambled = scramblePieces(buildSolvedBoard(), true);
    expect(scrambled.every((p) => [0, 90, 180, 270].includes(p.rotation))).toBe(true);
  });

  it('terminates for the smallest realistic board (2 pieces)', () => {
    // Sanity check that the retry-until-unsolved loop terminates quickly
    // for small boards, where the odds of drawing a solved shuffle are high.
    const scrambled = scramblePieces(buildSolvedBoard(2), false);
    expect(scrambled).toHaveLength(2);
    expect(checkIsSolved(scrambled)).toBe(false);
  });
});

describe('DIFFICULTY_SETTINGS', () => {
  it('defines an increasing grid size across easy, medium, and hard', () => {
    expect(DIFFICULTY_SETTINGS.easy.grid).toBeLessThan(DIFFICULTY_SETTINGS.medium.grid);
    expect(DIFFICULTY_SETTINGS.medium.grid).toBeLessThan(DIFFICULTY_SETTINGS.hard.grid);
  });

  it('only locks the hard difficulty behind a polaroid threshold', () => {
    expect(DIFFICULTY_SETTINGS.easy.threshold).toBe(0);
    expect(DIFFICULTY_SETTINGS.medium.threshold).toBe(0);
    expect(DIFFICULTY_SETTINGS.hard.threshold).toBeGreaterThan(0);
  });
});
