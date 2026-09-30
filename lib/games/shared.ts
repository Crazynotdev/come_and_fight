/**
 * Types partagés entre tous les moteurs de jeu (Dames, Puissance 4, ...).
 * Un moteur n'est qu'un module exposant ces trois fonctions avec ces
 * signatures exactes — voir docs/ADDING_A_GAME.md.
 */
export type Side = 1 | -1;
export type Board = number[][];
export interface Square { row: number; col: number }
export interface Step { from: Square; to: Square; captured?: Square }
export interface StepResult { board: Board; continueFrom?: Square; promoted?: boolean }
export interface GameOverInfo { over: boolean; winner?: Side; draw?: boolean }

export interface GameEngineModule {
  legalStepsForSide(board: Board, side: Side, forced: Square | null): Step[];
  applyStep(board: Board, step: Step, side: Side): StepResult;
  /** Appelé juste après un coup : `moverSide` vient de jouer, `nextSide` est censé enchaîner. */
  isGameOver(board: Board, moverSide: Side, nextSide: Side): GameOverInfo;
}
