-- COME-AND-FIGHT — Phase 1 : schéma initial
-- Convention : tous les montants sont des entiers (coins), jamais de float.

create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  player_id text unique not null, -- identifiant joueur public, ex: CF-4K9X2
  avatar_url text,
  wins integer not null default 0,
  losses integer not null default 0,
  games_played integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- WALLETS + LEDGER
-- ============================================================
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_available bigint not null default 0 check (balance_available >= 0),
  balance_reserved bigint not null default 0 check (balance_reserved >= 0),
  currency text not null default 'COINS',
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'DEPOSIT','GAME_ENTRY','WIN','PLATFORM_FEE','REFUND','WITHDRAWAL','BONUS'
  )),
  amount bigint not null check (amount <> 0),
  currency text not null default 'COINS',
  status text not null default 'COMPLETED' check (status in ('PENDING','COMPLETED','FAILED','REVERSED')),
  -- reference = clé d'idempotence métier, unique par type d'opération
  -- (ex: 'payment:<payment_id>', 'session:<session_id>:win', 'withdrawal:<withdrawal_id>')
  reference text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (type, reference)
);

create index wallet_transactions_user_id_idx on public.wallet_transactions(user_id);
create index wallet_transactions_wallet_id_idx on public.wallet_transactions(wallet_id);

-- ============================================================
-- PAYMENTS (DarePay) + EVENTS (idempotence des callbacks)
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'darepay',
  provider_reference text unique, -- id/transaction_id renvoyé par DarePay
  amount bigint not null check (amount > 0),
  currency text not null default 'XAF',
  status text not null default 'PENDING' check (status in ('PENDING','SUCCESS','FAILED','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments(user_id);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider_event_id text unique not null, -- déduplication native des callbacks dupliqués
  event_type text not null,
  raw_payload jsonb not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- WITHDRAWALS
-- ============================================================
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null check (amount > 0),
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')),
  destination jsonb not null, -- détails de destination (opérateur, numéro, etc.)
  reference text unique not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index withdrawals_user_id_idx on public.withdrawals(user_id);

-- ============================================================
-- GAMES / SESSIONS / PLAYERS / MOVES / RESULTS
-- ============================================================
create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, -- 'dames', 'puissance4', ...
  name text not null,
  min_players integer not null default 2,
  max_players integer not null default 2,
  min_stake bigint not null default 0,
  is_active boolean not null default true
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  code text unique not null, -- ex: CF-7K29X
  status text not null default 'WAITING' check (status in ('WAITING','IN_PROGRESS','FINISHED','CANCELLED')),
  stake bigint not null check (stake >= 0),
  pot bigint not null default 0,
  commission_percent numeric(5,2) not null default 10.00,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index game_sessions_status_idx on public.game_sessions(status);

create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  seat integer not null,
  status text not null default 'JOINED' check (status in ('JOINED','READY','PLAYING','DISCONNECTED','ABANDONED')),
  joined_at timestamptz not null default now(),
  unique (session_id, user_id),
  unique (session_id, seat)
);

create table public.game_moves (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  move_number integer not null,
  move_data jsonb not null,
  created_at timestamptz not null default now(),
  unique (session_id, move_number)
);

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.game_sessions(id) on delete cascade,
  winner_id uuid references public.profiles(id),
  result_type text not null check (result_type in ('WIN','DRAW','ABANDON','TIMEOUT')),
  pot bigint not null default 0,
  commission bigint not null default 0,
  payout bigint not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id, read);

-- ============================================================
-- AUDIT / ADMIN
-- ============================================================
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','SUPPORT')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid, -- null si action système
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_target_idx on public.audit_logs(target_type, target_id);

-- Jeux prévus (Dames en premier, les autres inactifs jusqu'à implémentation)
insert into public.games (slug, name, min_players, max_players, min_stake, is_active) values
  ('dames', 'Dames', 2, 2, 100, true),
  ('puissance4', 'Puissance 4', 2, 2, 100, false),
  ('morpion', 'Morpion', 2, 2, 50, false),
  ('dominos', 'Dominos', 2, 4, 100, false),
  ('ludo', 'Ludo', 2, 4, 100, false),
  ('echecs', 'Échecs', 2, 2, 200, false);
