/**
 * Moteur "Puissance 4" — grille 7 colonnes x 6 lignes. Un coup = poser un
 * jeton dans une colonne ; on le représente comme un "déplacement" from=to
 * (la case d'atterrissage) pour rester compatible avec le contrat partagé
 * (lib/games/shared.ts) sans toucher au format de move_data générique.
 */
import type { Board, GameOverInfo, Side, Square, Step, StepResult } from "../shared";

const ROWS = 6;
const COLS = 7;

export function initialBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function landingRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === 0) return r;
  return -1;
}

export function legalStepsForSide(board: Board, _side: Side, _forced: Square | null): Step[] {
  const steps: Step[] = [];
  for (let c = 0; c < COLS; c++) {
    const r = landingRow(board, c);
    if (r !== -1) steps.push({ from: { row: r, col: c }, to: { row: r, col: c } });
  }
  return steps;
}

export function applyStep(board: Board, step: Step, side: Side): StepResult {
  const next = board.map((row) => row.slice());
  next[step.to.row][step.to.col] = side;
  return { board: next };
}

function hasFourInARow(board: Board, side: Side): boolean {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== side) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let i = 1; i < 4; i++) {
          const rr = r + dr * i, cc = c + dc * i;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== side) break;
          count++;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

export function isGameOver(board: Board, moverSide: Side, _nextSide: Side): GameOverInfo {
  if (hasFourInARow(board, moverSide)) return { over: true, winner: moverSide };
  const full = board.every((row) => row.every((cell) => cell !== 0));
  if (full) return { over: true, draw: true };
  return { over: false };
}
