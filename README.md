# COME-AND-FIGHT — by CRAZY-TECH

Plateforme mobile-first de jeux multijoueurs compétitifs avec portefeuille numérique et paiements réels (marché initial : Gabon).

> Ce dépôt correspond à la **Phase 1** du plan de développement : architecture, schéma DB, RLS, skeleton Next.js/Supabase, design tokens Liquid Glass. Les phases suivantes (wallet, DarePay, matchmaking, Dames, admin, etc.) se construisent par-dessus cette base.

## Stack

- **Frontend** : Next.js (App Router) + TypeScript + Tailwind CSS + PWA
- **Backend** : Next.js API routes + Supabase (PostgreSQL, Auth, Realtime, Storage, RLS)
- **Paiements** : DarePay (callback sécurisé — voir doc officielle avant implémentation, ne rien inventer)
- **Hébergement** : Vercel (app) + Supabase (data)

## Architecture

```
Utilisateur → Next.js/Vercel → Supabase (PostgreSQL, Auth, Realtime, Storage, RLS)
DarePay → /api/darepay/callback → Wallet (ledger transactionnel)
```

Règle absolue : **le serveur est seul autoritaire** sur les résultats de jeu et les mouvements financiers. Le client ne décide jamais d'un résultat ni d'un montant.

## Setup local

```bash
npm install
cp .env.example .env.local   # renseigner les clés Supabase / DarePay
npx supabase db push         # applique les migrations (ou via le dashboard Supabase)
npm run dev
```

## Variables d'environnement

Voir `.env.example`. Ne jamais commiter de secrets. `SUPABASE_SECRET_KEY` et `DAREPAY_API_KEY` / `DAREPAY_CALLBACK_SECRET` restent strictement côté serveur.

## Schéma de base de données

Voir `supabase/migrations/0001_init.sql` (tables), `0002_rls.sql` (politiques RLS) et `0003_triggers.sql` (création profil + wallet à l'inscription).

Tables : `profiles`, `wallets`, `wallet_transactions`, `payments`, `payment_events`, `withdrawals`, `games`, `game_sessions`, `game_players`, `game_moves`, `game_results`, `notifications`, `audit_logs`, `admin_users`.

## Design system

Tokens de couleur et composants Glass dans `tailwind.config.ts` et `src/components/ui/`. Base sombre (noir profond / navy / graphite), accents cyan et orange, utilisés avec parcimonie.

## État d'avancement

- ✅ Phase 1 — architecture, schéma DB, RLS
- ✅ Phase 2 — design system Glass (`components/ui`) + navigation (`components/layout`) : BottomNavigation, DesktopSidebar, MobileHeader, BurgerMenu, AppShell, page dashboard de démonstration
- ✅ Phase 3 (partiel) — ledger wallet atomique et idempotent (`apply_wallet_ledger_entry`)
- ✅ Phase 4 (partiel) — callback DarePay conforme à la doc officielle (`/api/darepay/callback`), idempotent
- ⛔ Initiation de paiement (`/api/payments/initiate`) : bloquée en attente de la doc DarePay "Référence API"
- ⬜ Auth Supabase branchée sur l'UI (le dashboard affiche un pseudo/solde statiques pour l'instant), matchmaking, Dames, admin, PWA, tests

## Prochaines étapes

1. Auth Supabase (inscription/connexion, protection des routes `(app)`)
2. Brancher le dashboard sur les vraies données (profil, wallet)
3. Compléter l'intégration DarePay (doc "Référence API" nécessaire)
4. Sessions de jeu + matchmaking + Realtime
5. Jeu DAMES complet (règles serveur-autoritaires)

## Avertissement réglementaire

Ce produit implique de la mise réelle entre joueurs. Selon la juridiction visée, cela peut relever d'une réglementation sur les jeux d'argent (licence, KYC/AML, âge minimum, fiscalité). À valider côté légal avant tout lancement avec paiements réels en production.

## Direction visuelle (mise à jour)

Identité "COME-AND-FIGHT PRO" : logo couronne (SVG, `components/brand/Logo.tsx`), orange comme couleur d'action principale (bouton primaire), cyan en accent secondaire, fond avec streaks lumineux diagonaux animés (`components/marketing/AmbientBackground.tsx`). Navigation mobile en icônes cerclées (capsule active pleine).

Pages ajoutées cette itération, toutes réellement branchées à Supabase (pas de données inventées) :
- Login / Signup : connexion sociale Google/Apple/Facebook (`supabase.auth.signInWithOAuth`, nécessite l'activation des providers côté dashboard Supabase), lien "mot de passe oublié"
- `/forgot-password` : `resetPasswordForEmail` réel
- `/history` : historique filtrable par onglets (Toutes/Dépôts/Mises/Gains), lit `wallet_transactions`
- `/notifications` : filtrable par onglets (Paiements/Jeux/Système), lit la table `notifications` (vide tant qu'aucune fonctionnalité n'en crée)
- Wallet : sheet de retrait avec montants rapides + choix du moyen (UI seule, validation désactivée tant que DarePay n'est pas branché)

Non fait dans cette itération (mockup screens 07/08/09/10 — création de partie, recherche d'adversaire, plateau de jeu, écran de victoire) : nécessite le moteur de jeu + matchmaking (Phase 5/6), pas encore construits. `/games/[slug]` reste un écran "en construction" en attendant.

## Sessions de jeu, matchmaking, Dames (cette itération)

- **Sessions** : `/api/sessions/create` (partie privée + code), `/api/sessions/join`
  (par code), `/api/sessions/quick-match` (recherche automatique d'un adversaire sur
  la même mise, sinon crée une partie WAITING), `/api/sessions/[id]/abandon`,
  `/api/sessions/[id]/timeout` (forfait vérifié serveur), `/api/sessions/[id]/move`.
- **Dames** : moteur complet dans `lib/games/dames/engine.ts` (10x10, prise
  obligatoire, prise multiple, dame volante, promotion) — voir `docs/ADDING_A_GAME.md`
  pour la liste des simplifications assumées et comment brancher un nouveau jeu.
- **Realtime** : `lib/hooks/useGameSession.ts` — les deux joueurs voient le plateau
  se mettre à jour en direct (Supabase Realtime sur `game_sessions`/`game_players`).
- **Sécurité anti-triche** : détaillée dans `docs/ADDING_A_GAME.md` §5 (serveur
  autoritaire, verrou optimiste, idempotence financière, anti-spam, timeout
  vérifié serveur, RLS stricte).
- **Pages** : `/games/dames` (lobby : mise, partie rapide, créer, rejoindre par code),
  `/games/dames/[sessionId]` (salle d'attente → plateau → écran de fin).

À noter : le paiement DarePay reste en `501 not_implemented` (voir plus haut) —
tout le reste (sessions, mises, règlement, wallet) fonctionne déjà en coins,
sans paiement réel branché, comme convenu.

## Durcissement sécurité + Puissance 4 + parties gratuites (cette itération)

**Sécurité** :
- Code de session : 5 hex (~1M combinaisons) → 8 caractères base32 sans ambiguïté (~1,1 trilliard)
- Rate-limit anti brute-force sur `/api/sessions/join` (1 tentative/1.5s/utilisateur) en plus de celui déjà en place sur `/move`
- En-têtes HTTP de sécurité globaux (`next.config.js`) : CSP stricte (uniquement notre origine + Supabase), `X-Frame-Options: DENY`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- **Bug corrigé** : `wins`/`losses`/`games_played` sur `profiles` n'étaient jamais mis à jour après une partie (trigger manquant) — corrigé en 0011, donc profil et classement reflètent maintenant les vraies parties jouées

**Puissance 4** : moteur complet (`lib/games/puissance4/engine.ts`), branché sur toute l'infra existante (sessions, wallet, Realtime, anti-triche, timeout) sans dupliquer de logique serveur — la route `/move` choisit maintenant le moteur selon `games.slug` (`lib/games/registry.ts`), au lieu d'être câblée en dur sur Dames.

**Parties gratuites** : bouton "Partie gratuite" dans le lobby (mise = 0) — aucune écriture wallet, servent à s'entraîner sans risquer de coins. Contrôlable par jeu via `games.allow_free_play`.

**Pages complétées** (étaient de simples coquilles vides) : `/settings` (changer le pseudo), `/security` (changer le mot de passe + conseils), `/help` (FAQ réelle), `/about` (enrichie), `/leaderboard` (vrai classement par victoires, lit `profiles`).

## Ce qui reste avant une vraie mise en production

Un site qui manipule de l'argent réel ne devient jamais "prêt pour la prod" par un seul livrable — voici ce qui reste, honnêtement :
- **Paiement réel** : toujours bloqué sur la doc DarePay "Référence API" (création de paiement)
- **Revue de sécurité indépendante** avant d'ouvrir à de vrais utilisateurs avec de vrais fonds (ce que j'ai fait ici est du bon sens défensif, pas un audit professionnel)
- **Conformité légale** (jeux d'argent, Gabon) — tu as mentionné avoir les autorisations, mais je ne peux pas la vérifier
- Load testing, monitoring/alerting, sauvegardes DB automatisées
- Morpion / Dominos / Ludo / Échecs : pas encore branchés (même méthode que Puissance 4, voir `docs/ADDING_A_GAME.md`)

## Déploiement Vercel

1. **Vercel → Project Settings → Environment Variables** : renseigner `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PLATFORM_FEE_PERCENT`,
   `NEXT_PUBLIC_SITE_URL` (ton domaine Vercel, ex: `https://come-and-fight.vercel.app`).
   `.env.local` n'est jamais déployé — c'est normal, il est dans `.gitignore`.
2. **Supabase → Authentication → URL Configuration** : ajouter ton domaine Vercel (prod + previews)
   aux Redirect URLs. Sans ça, la connexion sociale et "mot de passe oublié" redirigent vers
   `localhost` et échouent silencieusement.
3. Appliquer les migrations 0001 à 0012 sur Supabase (SQL Editor) si pas déjà fait.
4. Aucune config Vercel spéciale nécessaire (`vercel.json`) — Next.js App Router est détecté
   automatiquement, y compris le middleware (Edge Runtime, compatible `@supabase/ssr`).

**Rate-limit** : passé d'une `Map` en mémoire à une table Postgres (`rate_limit_hits`, migration
0012) — une Map ne suffit pas en serverless multi-instance (Vercel peut traiter deux requêtes sur
deux conteneurs qui ne partagent rien). Fail-open si la vérification elle-même échoue : ce n'est
qu'une couche de protection en plus, pas le seul garde-fou (verrou optimiste + règles serveur restent
la vraie protection).

**Dames** : damier repeint en deux tons réels (plus lisible), vraies couronnes pour les dames
promues (icône, plus un texte "D"). Le jeu était déjà complet côté règles (prise obligatoire, prise
multiple, dame volante) — ce tour ne touche que le rendu visuel.
