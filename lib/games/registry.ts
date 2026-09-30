import * as dames from "./dames/engine";
import * as puissance4 from "./puissance4/engine";
import type { GameEngineModule } from "./shared";

/** Registre des moteurs de jeu branchés. Ajouter une ligne ici pour un nouveau jeu — voir docs/ADDING_A_GAME.md. */
const engines: Record<string, GameEngineModule & { initialBoard: () => number[][] }> = {
  dames,
  puissance4,
};

export function getEngine(slug: string) {
  const engine = engines[slug];
  if (!engine) throw new Error(`Moteur non branché pour le jeu : ${slug}`);
  return engine;
}
