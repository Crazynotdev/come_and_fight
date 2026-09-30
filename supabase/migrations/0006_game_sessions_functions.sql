-- COME-AND-FIGHT — sessions de jeu : état du plateau + fonctions serveur-autoritaires.
-- Toutes les opérations qui touchent à l'argent (réservation de mise, règlement) ou
-- au statut d'une session sont ici, en PL/pgSQL, pour garantir l'atomicité — jamais
-- fait en deux appels séparés depuis le serveur Next.js.

alter table public.game_sessions
  add column board_state jsonb,
  add column turn smallint,          -- 1 ou -1 : côté qui doit jouer
  add column forced_row smallint,    -- piège en cours de rafle multiple (case de départ)
  add column forced_col smallint,
  add column version integer not null default 0; -- verrou optimiste (anti-course sur les coups)

-- ============================================================
-- Génération d'un code de session unique (CF-XXXXX)
-- ============================================================
create or replace function public.generate_session_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'CF-' || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    select exists(select 1 from public.game_sessions where code = candidate) into exists_already;
    exit when not exists_already;
  end loop;
  return candidate;
end;
$$;

-- ============================================================
-- Réserver une mise (available -> reserved), idempotent par reference
-- ============================================================
create or replace function public.reserve_wallet_funds(p_user_id uuid, p_amount bigint, p_reference text)
returns public.wallet_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_available bigint;
  v_row public.wallet_transactions;
begin
  select id, balance_available into v_wallet_id, v_available
    from public.wallets where user_id = p_user_id for update;
  if v_wallet_id is null then
    raise exception 'wallet introuvable pour user_id %', p_user_id;
  end if;

  insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, reference, metadata)
  values (v_wallet_id, p_user_id, 'GAME_ENTRY', -p_amount, 'COINS', 'COMPLETED', p_reference, '{}'::jsonb)
  on conflict (type, reference) do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row from public.wallet_transactions where type = 'GAME_ENTRY' and reference = p_reference;
    return v_row; -- déjà réservé (rejeu de l'appel) : on ne débite pas deux fois
  end if;

  if v_available < p_amount then
    raise exception 'solde insuffisant';
  end if;

  update public.wallets
    set balance_available = balance_available - p_amount,
        balance_reserved = balance_reserved + p_amount,
        updated_at = now()
    where id = v_wallet_id;

  return v_row;
end;
$$;

revoke execute on function public.reserve_wallet_funds(uuid, bigint, text) from public, authenticated, anon;
grant execute on function public.reserve_wallet_funds(uuid, bigint, text) to service_role;

-- ============================================================
-- Créer une session de jeu (réserve la mise du créateur dans la foulée)
-- ============================================================
create or replace function public.create_game_session(p_user_id uuid, p_game_slug text, p_stake bigint)
returns public.game_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.games;
  v_session public.game_sessions;
  v_code text;
begin
  select * into v_game from public.games where slug = p_game_slug and is_active for update;
  if v_game.id is null then
    raise exception 'jeu inconnu ou inactif : %', p_game_slug;
  end if;
  if p_stake < v_game.min_stake then
    raise exception 'mise minimum non atteinte (min %)', v_game.min_stake;
  end if;

  v_code := public.generate_session_code();

  insert into public.game_sessions (game_id, code, status, stake, pot, created_by)
  values (v_game.id, v_code, 'WAITING', p_stake, 0, p_user_id)
  returning * into v_session;

  insert into public.game_players (session_id, user_id, seat, status)
  values (v_session.id, p_user_id, 1, 'JOINED');

  perform public.reserve_wallet_funds(p_user_id, p_stake, 'session:' || v_session.id || ':entry:' || p_user_id);

  return v_session;
end;
$$;

revoke execute on function public.create_game_session(uuid, text, bigint) from public, authenticated, anon;
grant execute on function public.create_game_session(uuid, text, bigint) to service_role;

-- ============================================================
-- Rejoindre une session par code (réserve la mise du joueur, démarre si complète)
-- ============================================================
create or replace function public.join_game_session(p_user_id uuid, p_code text)
returns public.game_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
  v_game public.games;
  v_player_count integer;
begin
  select * into v_session from public.game_sessions where code = p_code for update;
  if v_session.id is null then
    raise exception 'partie introuvable';
  end if;
  if v_session.status <> 'WAITING' then
    raise exception 'cette partie n''est plus disponible';
  end if;
  if exists(select 1 from public.game_players where session_id = v_session.id and user_id = p_user_id) then
    raise exception 'tu es déjà dans cette partie';
  end if;

  select * into v_game from public.games where id = v_session.game_id;
  select count(*) into v_player_count from public.game_players where session_id = v_session.id;
  if v_player_count >= v_game.max_players then
    raise exception 'partie complète';
  end if;

  insert into public.game_players (session_id, user_id, seat, status)
  values (v_session.id, p_user_id, v_player_count + 1, 'JOINED');

  perform public.reserve_wallet_funds(p_user_id, v_session.stake, 'session:' || v_session.id || ':entry:' || p_user_id);

  if v_player_count + 1 = v_game.max_players then
    update public.game_sessions
      set status = 'IN_PROGRESS', started_at = now()
      where id = v_session.id
      returning * into v_session;
  end if;

  return v_session;
end;
$$;

revoke execute on function public.join_game_session(uuid, text) from public, authenticated, anon;
grant execute on function public.join_game_session(uuid, text) to service_role;

-- ============================================================
-- Règlement financier de fin de partie (gain, égalité, abandon) — idempotent
-- ============================================================
create or replace function public.settle_game_session(p_session_id uuid, p_winner_id uuid, p_result_type text)
returns public.game_results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
  v_pot bigint;
  v_commission bigint;
  v_payout bigint;
  v_result public.game_results;
  r record;
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;
  if v_session.id is null then
    raise exception 'session introuvable';
  end if;

  -- Idempotence : un règlement déjà effectué renvoie simplement le résultat existant.
  select * into v_result from public.game_results where session_id = p_session_id;
  if v_result.id is not null then
    return v_result;
  end if;
  if v_session.status = 'FINISHED' then
    raise exception 'session déjà terminée sans ligne de résultat (incohérence)';
  end if;

  v_pot := v_session.stake * (select count(*) from public.game_players where session_id = p_session_id);

  -- Verrouille les wallets des joueurs dans un ordre stable (évite les deadlocks).
  for r in
    select gp.user_id from public.game_players gp where gp.session_id = p_session_id order by gp.user_id
  loop
    perform 1 from public.wallets where user_id = r.user_id for update;
  end loop;

  if p_result_type = 'DRAW' then
    v_commission := 0;
    for r in select user_id from public.game_players where session_id = p_session_id loop
      update public.wallets set balance_reserved = balance_reserved - v_session.stake,
                                 balance_available = balance_available + v_session.stake,
                                 updated_at = now()
        where user_id = r.user_id;
      insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, reference)
        select id, r.user_id, 'REFUND', v_session.stake, 'COINS', 'COMPLETED',
               'session:' || p_session_id || ':refund:' || r.user_id
        from public.wallets where user_id = r.user_id
        on conflict (type, reference) do nothing;
    end loop;
    v_payout := 0;
  else
    v_commission := round(v_pot * v_session.commission_percent / 100.0);
    v_payout := v_pot - v_commission;

    for r in select user_id from public.game_players where session_id = p_session_id loop
      update public.wallets set balance_reserved = balance_reserved - v_session.stake, updated_at = now()
        where user_id = r.user_id;
    end loop;

    if p_winner_id is not null then
      update public.wallets set balance_available = balance_available + v_payout, updated_at = now()
        where user_id = p_winner_id;
      insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, reference)
        select id, p_winner_id, 'WIN', v_payout, 'COINS', 'COMPLETED', 'session:' || p_session_id || ':win'
        from public.wallets where user_id = p_winner_id
        on conflict (type, reference) do nothing;
    end if;
  end if;

  insert into public.game_results (session_id, winner_id, result_type, pot, commission, payout)
  values (p_session_id, p_winner_id, p_result_type, v_pot, v_commission, v_payout)
  returning * into v_result;

  update public.game_sessions set status = 'FINISHED', finished_at = now(), pot = v_pot where id = p_session_id;

  return v_result;
end;
$$;

revoke execute on function public.settle_game_session(uuid, uuid, text) from public, authenticated, anon;
grant execute on function public.settle_game_session(uuid, uuid, text) to service_role;
