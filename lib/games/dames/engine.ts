/**
 * Moteur "Dames" (variante internationale 10x10), pur — aucune dépendance
 * Supabase/Next. Voir docs/ADDING_A_GAME.md pour le contrat attendu par un
 * nouveau jeu.
 *
 * Board : grille 10x10, une case = un nombre :
 *   0 = vide, 1 = pion côté 1, 2 = dame côté 1, -1 = pion côté -1, -2 = dame côté -1.
 * Side : 1 ou -1. Côté 1 avance en augmentant `row`, côté -1 en diminuant.
 *
 * Règles implémentées : prise obligatoire, prise multiple (même pièce doit
 * continuer tant qu'une capture s'enchaîne), pion capture dans les 4
 * diagonales, dame "volante" (déplacement et capture à distance).
 * Simplification assumée (documentée) : pas de règle FMJD de "prise
 * maximale" — si plusieurs captures sont possibles, le joueur choisit
 * librement laquelle jouer.
 */

export type Side = 1 | -1;
export type Board = number[][]; // 10x10
export interface Square { row: number; col: number }
export interface Step { from: Square; to: Square; captured?: Square }
export interface StepResult { board: Board; continueFrom?: Square; promoted?: boolean }

const SIZE = 10;
const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const isDark = (r: number, c: number) => (r + c) % 2 === 1;
const eqSq = (a: Square, b: Square) => a.row === b.row && a.col === b.col;

export function initialBoard(): Board {
  const board: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isDark(r, c)) continue;
      if (r < 4) board[r][c] = 1;
      else if (r > 5) board[r][c] = -1;
    }
  }
  return board;
}

function cloneBoard(b: Board): Board {
  return b.map((row) => row.slice());
}

function capturesFromSquare(board: Board, sq: Square, side: Side): Step[] {
  const piece = board[sq.row][sq.col];
  if (piece === 0 || Math.sign(piece) !== side) return [];
  const king = Math.abs(piece) === 2;
  const steps: Step[] = [];
  const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (const [dr, dc] of dirs) {
    if (king) {
      let i = 1;
      while (inBounds(sq.row + dr * i, sq.col + dc * i)) {
        const mid: Square = { row: sq.row + dr * i, col: sq.col + dc * i };
        const midPiece = board[mid.row][mid.col];
        if (midPiece !== 0) {
          if (Math.sign(midPiece) === side) break; // pièce alliée : bloque
          let j = i + 1;
          while (inBounds(sq.row + dr * j, sq.col + dc * j)) {
            const land: Square = { row: sq.row + dr * j, col: sq.col + dc * j };
            if (board[land.row][land.col] !== 0) break;
            steps.push({ from: sq, to: land, captured: mid });
            j++;
          }
          break;
        }
        i++;
      }
    } else {
      const mid: Square = { row: sq.row + dr, col: sq.col + dc };
      const land: Square = { row: sq.row + dr * 2, col: sq.col + dc * 2 };
      if (!inBounds(land.row, land.col)) continue;
      const midPiece = board[mid.row]?.[mid.col];
      if (midPiece && Math.sign(midPiece) !== side && board[land.row][land.col] === 0) {
        steps.push({ from: sq, to: land, captured: mid });
      }
    }
  }
  return steps;
}

function simpleMovesFromSquare(board: Board, sq: Square, side: Side): Step[] {
  const piece = board[sq.row][sq.col];
  if (piece === 0 || Math.sign(piece) !== side) return [];
  const king = Math.abs(piece) === 2;
  const steps: Step[] = [];

  if (king) {
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      let i = 1;
      while (inBounds(sq.row + dr * i, sq.col + dc * i)) {
        const to: Square = { row: sq.row + dr * i, col: sq.col + dc * i };
        if (board[to.row][to.col] !== 0) break;
        steps.push({ from: sq, to });
        i++;
      }
    }
  } else {
    const dr = side === 1 ? 1 : -1;
    for (const dc of [1, -1]) {
      const to: Square = { row: sq.row + dr, col: sq.col + dc };
      if (inBounds(to.row, to.col) && board[to.row][to.col] === 0) steps.push({ from: sq, to });
    }
  }
  return steps;
}

function allSquaresOf(board: Board, side: Side): Square[] {
  const out: Square[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (Math.sign(board[r][c]) === side) out.push({ row: r, col: c });
  return out;
}

/** Coups légaux pour `side`. Si `forced` est fourni, ne renvoie que les prises depuis cette case. */
export function legalStepsForSide(board: Board, side: Side, forced: Square | null): Step[] {
  if (forced) return capturesFromSquare(board, forced, side);

  const squares = allSquaresOf(board, side);
  const captures = squares.flatMap((sq) => capturesFromSquare(board, sq, side));
  if (captures.length > 0) return captures; // prise obligatoire
  return squares.flatMap((sq) => simpleMovesFromSquare(board, sq, side));
}

/** Applique un coup déjà validé (via legalStepsForSide) — ne revalide pas. */
export function applyStep(board: Board, step: Step, _side?: Side): StepResult {
  const next = cloneBoard(board);
  const piece = next[step.from.row][step.from.col];
  const side: Side = Math.sign(piece) as Side;
  next[step.from.row][step.from.col] = 0;
  if (step.captured) next[step.captured.row][step.captured.col] = 0;

  const reachedBackRow = side === 1 ? step.to.row === SIZE - 1 : step.to.row === 0;
  const promoted = Math.abs(piece) === 1 && reachedBackRow;
  next[step.to.row][step.to.col] = promoted ? side * 2 : piece;

  let continueFrom: Square | undefined;
  if (step.captured) {
    const chain = capturesFromSquare(next, step.to, side);
    if (chain.length > 0) continueFrom = step.to;
  }

  return { board: next, continueFrom, promoted: promoted || undefined };
}

/** true si `side` n'a plus aucun coup légal (défaite : blocage ou plus de pièces). */
export function sideHasNoMoves(board: Board, side: Side): boolean {
  return legalStepsForSide(board, side, null).length === 0;
}

/** Contrat générique (voir lib/games/shared.ts) : le camp qui vient de jouer
 * gagne si l'adversaire n'a plus aucun coup légal. */
export function isGameOver(board: Board, moverSide: Side, nextSide: Side) {
  if (sideHasNoMoves(board, nextSide)) return { over: true as const, winner: moverSide };
  return { over: false as const };
}

export const damesEngineInfo = {
  slug: "dames" as const,
  boardSize: SIZE,
  turnTimeoutSeconds: 60,
};

export function stepsEqual(a: Step, b: Step): boolean {
  return eqSq(a.from, b.from) && eqSq(a.to, b.to) &&
    (!!a.captured === !!b.captured) && (!a.captured || !b.captured || eqSq(a.captured, b.captured));
}
