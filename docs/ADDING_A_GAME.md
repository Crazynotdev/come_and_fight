# Ajouter un nouveau jeu

COME-AND-FIGHT est construit pour accueillir plusieurs jeux (Puissance 4, Morpion,
Dominos, Ludo, Échecs...) sans réécrire l'infrastructure : sessions, mises,
matchmaking, wallet, ledger, Realtime sont **génériques**. Seul le moteur de
règles change d'un jeu à l'autre. Voici comment brancher un nouveau jeu, en
prenant `lib/games/dames/engine.ts` comme référence.

## 1. Ce qui est déjà générique (ne pas toucher)

- **Table `games`** : catalogue (slug, nom, joueurs min/max, mise min, actif).
  Un nouveau jeu = une ligne `insert into games (...)`.
- **Sessions** (`game_sessions`, `game_players`, `game_moves`, `game_results`) :
  code de partie, statut, mise, pot, commission, verrou optimiste (`version`).
- **Argent** : `reserve_wallet_funds`, `create_game_session`, `join_game_session`,
  `settle_game_session`, `cancel_waiting_session` (voir migrations 0005-0007) —
  ces fonctions SQL sont **indépendantes du jeu**, elles ne connaissent que la
  mise et le nombre de joueurs. Ne jamais dupliquer cette logique pour un
  nouveau jeu.
- **Matchmaking** (`/api/sessions/quick-match`, `/create`, `/join`) : déjà
  paramétrés par `gameSlug` — rien à changer.
- **Realtime** (`lib/hooks/useGameSession.ts`) : générique, suit n'importe
  quelle session par id.

## 2. Ce qu'il faut écrire pour un nouveau jeu

### a. Le moteur de règles (pur, sans DB)

Créer `lib/games/<slug>/engine.ts`. Il doit exposer, au minimum, l'équivalent
de ce que fait `lib/games/dames/engine.ts` :

- un type d'état de plateau sérialisable en JSON (stocké tel quel dans
  `game_sessions.board_state`) ;
- `initialBoard()` — position de départ ;
- `legalStepsForSide(board, side, forced?)` — coups légaux pour le camp à
  jouer. `forced` sert aux mécaniques de type "rafle multiple" (mets `null`
  si le jeu n'en a pas) ;
- `applyStep(board, step)` — applique un coup, renvoie le nouveau plateau et
  si le même joueur doit rejouer (`continueFrom`) ;
- `sideHasNoMoves(board, side)` — condition de défaite (adapter à la vraie
  condition de fin du jeu : échec et mat, alignement de 4, plus de coup
  possible, etc.).

Le moteur ne doit **jamais** importer Supabase ni Next — il doit être
testable isolément (`legalStepsForSide`/`applyStep` sont des fonctions pures).

### b. Brancher le moteur dans la route de coup

Le point d'extension est `app/api/sessions/[id]/move/route.ts` : il importe
aujourd'hui uniquement le moteur Dames. Pour un 2e jeu, récupérer le slug du
jeu de la session (`session.game_id` → jointure sur `games.slug`) et faire un
`switch` vers le bon moteur avant d'appeler `legalStepsForSide`/`applyStep`.

### c. L'UI

- `components/games/<slug>/<Nom>Board.tsx` — rendu du plateau + interactions,
  sur le modèle de `components/games/dames/DamesBoard.tsx`.
- `components/games/<slug>/<Nom>Lobby.tsx` — partie rapide / créer / rejoindre,
  sur le modèle de `DamesLobby.tsx` (généralement copier-coller quasi tel
  quel, seul `gameSlug` change).
- `app/(app)/games/<slug>/page.tsx` (lobby) et
  `app/(app)/games/<slug>/[sessionId]/page.tsx` (plateau), sur le modèle des
  pages Dames.
- Ajouter une `GameArt` (illustration SVG) dans
  `components/games/GameArt.tsx` et passer `is_active = true` pour le jeu
  dans la table `games` une fois prêt (la page `/games` et le dashboard le
  détecteront automatiquement).

## 3. Ce que `board_state` peut contenir

`board_state` est un `jsonb` libre — pas de schéma imposé au-delà d'être
sérialisable. Pour un jeu à plateau (Puissance 4, Morpion), une grille 2D
suffit. Pour un jeu sans plateau spatial (Dominos, Ludo), stocker la
structure qui a du sens (mains des joueurs, positions sur le circuit...) — le
reste de l'infra (verrou optimiste, Realtime, mises) fonctionne pareil.

## 4. Simplifications actuelles à connaître

- Dames : prise obligatoire oui, mais pas la règle FMJD de la "prise
  maximale" (voir commentaire en tête de `lib/games/dames/engine.ts`).
- Timeout par tour : `games.turn_timeout_seconds` (60s pour Dames) +
  `game_sessions.turn_started_at`, vérifiés côté serveur par
  `claim_timeout_forfeit` (migration 0009) — n'importe quel joueur peut
  réclamer le forfait de l'autre via `/api/sessions/[id]/timeout`, mais le
  serveur revérifie le délai et l'identité avant d'accepter. Pas encore de
  forfait automatique sans action d'un joueur (pas de cron).
- Pas de reconnexion différenciée : Realtime fait que rafraîchir la page
  suffit à retrouver l'état exact, mais il n'y a pas d'indicateur "adversaire
  déconnecté" dédié.

## 5. Sécurité anti-triche (déjà en place, à respecter pour tout nouveau jeu)

- **Le client ne décide jamais du résultat.** `applyStep`/`legalStepsForSide`
  tournent uniquement côté serveur (route Handler), avec le client Supabase
  `service_role` (`lib/server/supabase-admin.ts`). Le plateau envoyé par le
  client n'est jamais utilisé — le serveur recharge `board_state` depuis la
  base avant de valider.
- **Verrou optimiste** (`game_sessions.version`) : toute mise à jour du
  plateau est conditionnée à `WHERE version = <version lue>`. Si deux
  requêtes de coup arrivent en course, la seconde échoue proprement
  (409, "un autre coup vient d'être joué") au lieu de corrompre l'état.
- **Idempotence financière** : chaque mise, gain, remboursement est une ligne
  `wallet_transactions` avec une `reference` unique déterministe
  (`session:<id>:entry:<user>`, `:win`, `:refund`...) — rejouer un appel ne
  débite/crédite jamais deux fois.
- **Anti-spam** : `lib/server/rateLimit.ts` limite un joueur à un coup toutes
  les 250ms par session (429 sinon). Limite connue : en mémoire par
  instance, pas partagée en multi-instance — passer à un store partagé
  (Redis/Upstash) si la charge le justifie.
- **Timeout vérifié serveur** : voir section 4. Le client affiche une
  horloge indicative, mais seul `claim_timeout_forfeit` (SQL) décide si le
  délai est réellement écoulé, à partir de `turn_started_at` en base.
- **RLS** : `game_states`-like colonnes sur `game_sessions`, `game_moves`,
  `game_results` sont lisibles par les participants uniquement, et
  **jamais** écrites par le client (aucune policy INSERT/UPDATE pour
  `authenticated` sur ces tables — voir migration 0002).
- **Validation stricte des entrées** : tout payload de route passe par un
  schéma `zod` (`lib/games/http.ts`) avant d'être utilisé.

Pour un nouveau jeu : tant que `applyStep`/`legalStepsForSide` restent pures
et que la route `/move` continue de recharger l'état depuis la DB avant de
valider, ces garanties s'appliquent automatiquement — aucune sécurité à
réécrire par jeu.
