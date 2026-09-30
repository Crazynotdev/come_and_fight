-- COME-AND-FIGHT — Phase 1 : Row Level Security
--
-- Principe directeur : une table n'a QUE les policies listées ci-dessous.
-- Toute opération non couverte par une policy est refusée par défaut dès
-- que RLS est activé. Les écritures financières et les résultats de jeu
-- ne sont volontairement PAS ouvertes au client : elles passent par
-- lib/server/supabase-admin.ts (clé service role, qui bypass RLS) depuis
-- des Route Handlers qui appliquent la validation serveur-autoritaire.

-- Fonction utilitaire : est-ce que l'utilisateur courant est admin ?
-- security definer + search_path fixé pour éviter tout contournement RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
alter table public.profiles enable row level security;

create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true); -- profils publics (pseudo/avatar/stats) nécessaires pour afficher les adversaires

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- L'insertion se fait via un trigger sur auth.users (voir 0003_triggers.sql),
-- pas de policy INSERT cliente.

-- ============================================================
-- WALLETS — lecture seule pour le titulaire, écriture jamais côté client
-- ============================================================
alter table public.wallets enable row level security;

create policy "wallets_select_own"
  on public.wallets for select
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- WALLET_TRANSACTIONS — lecture seule (le ledger, jamais modifiable par le client)
-- ============================================================
alter table public.wallet_transactions enable row level security;

create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- PAYMENTS — lecture seule pour le titulaire ; création via route serveur
-- ============================================================
alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- PAYMENT_EVENTS — aucun accès client (callback DarePay only, via admin client)
-- ============================================================
alter table public.payment_events enable row level security;
-- Volontairement aucune policy : select/insert/update tous refusés côté client.

-- ============================================================
-- WITHDRAWALS — le titulaire peut consulter et demander un retrait,
-- jamais le modifier ou l'annuler après coup (ça, c'est le rôle du serveur/admin).
-- ============================================================
alter table public.withdrawals enable row level security;

create policy "withdrawals_select_own"
  on public.withdrawals for select
  to authenticated
  using (user_id = auth.uid());

create policy "withdrawals_insert_own_pending"
  on public.withdrawals for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'PENDING'
    and amount > 0
  );
-- Le débit réel du wallet (réservation des fonds) est fait par le serveur
-- dans la même transaction que cet insert, via le client admin — voir
-- la route /api/withdrawals dans une phase ultérieure.

-- ============================================================
-- GAMES — catalogue public
-- ============================================================
alter table public.games enable row level security;

create policy "games_select_public"
  on public.games for select
  to anon, authenticated
  using (true);

-- ============================================================
-- GAME_SESSIONS — lobby public (parties en attente) + ses propres parties
-- ============================================================
alter table public.game_sessions enable row level security;

create policy "game_sessions_select_visible"
  on public.game_sessions for select
  to authenticated
  using (
    status = 'WAITING'
    or created_by = auth.uid()
    or exists (
      select 1 from public.game_players gp
      where gp.session_id = game_sessions.id and gp.user_id = auth.uid()
    )
  );
-- Pas de policy INSERT/UPDATE : la création de partie et la mise à jour de
-- statut/pot passent par une route serveur (réservation de mise atomique).

-- ============================================================
-- GAME_PLAYERS — visible pour les participants et pour le lobby (compteur 1/2)
-- ============================================================
alter table public.game_players enable row level security;

create policy "game_players_select_visible"
  on public.game_players for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.game_sessions gs
      where gs.id = game_players.session_id
        and (gs.status = 'WAITING' or gs.created_by = auth.uid())
    )
  );
-- Rejoindre une partie = route serveur (lock de siège + réservation de mise
-- atomiques), jamais un insert direct côté client.

-- ============================================================
-- GAME_MOVES — visible aux seuls participants ; jamais écrit par le client
-- ============================================================
alter table public.game_moves enable row level security;

create policy "game_moves_select_participants"
  on public.game_moves for select
  to authenticated
  using (
    exists (
      select 1 from public.game_players gp
      where gp.session_id = game_moves.session_id and gp.user_id = auth.uid()
    )
  );
-- Chaque coup est soumis à une route serveur qui valide la règle du jeu
-- puis écrit via le client admin. Le client ne peut jamais écrire un coup
-- directement : c'est la garantie du "serveur autoritaire".

-- ============================================================
-- GAME_RESULTS — visible aux participants ; jamais écrit par le client
-- ============================================================
alter table public.game_results enable row level security;

create policy "game_results_select_participants"
  on public.game_results for select
  to authenticated
  using (
    exists (
      select 1 from public.game_players gp
      where gp.session_id = game_results.session_id and gp.user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own_mark_read"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- ADMIN_USERS / AUDIT_LOGS — réservés aux admins
-- ============================================================
alter table public.admin_users enable row level security;

create policy "admin_users_select_admins"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admins"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());
