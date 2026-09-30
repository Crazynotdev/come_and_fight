-- COME-AND-FIGHT — durcissement sécurité + parties gratuites.
-- Tout ici est en CREATE OR REPLACE : rejouable même si 0006-0009 sont déjà appliquées.

-- ============================================================
-- 1) Code de session : entropie bien plus forte (brute-force plus dur).
--    Avant : 'CF-' + 5 caractères hex (~1M combinaisons).
--    Après : 'CF-' + 8 caractères base32 sans ambiguïté (32^8 ≈ 1,1 trilliard).
-- ============================================================
create or replace function public.generate_session_code()
returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; -- pas de 0/O/1/I/L (lisibilité)
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'CF-';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    select exists(select 1 from public.game_sessions where code = candidate) into exists_already;
    exit when not exists_already;
  end loop;
  return candidate;
end;
$$;

-- ============================================================
-- 2) Parties gratuites (stake = 0) : autorisées explicitement par jeu,
--    aucune écriture financière (pas de wallet_transactions à amount=0,
--    interdit par la contrainte `amount <> 0`).
-- ============================================================
alter table public.games add column if not exists allow_free_play boolean not null default true;

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

  if p_stake = 0 then
    if not v_game.allow_free_play then
      raise exception 'les parties gratuites ne sont pas activées pour ce jeu';
    end if;
  elsif p_stake < v_game.min_stake then
    raise exception 'mise minimum non atteinte (min %)', v_game.min_stake;
  end if;

  v_code := public.generate_session_code();

  insert into public.game_sessions (game_id, code, status, stake, pot, created_by)
  values (v_game.id, v_code, 'WAITING', p_stake, 0, p_user_id)
  returning * into v_session;

  insert into public.game_players (session_id, user_id, seat, status)
  values (v_session.id, p_user_id, 1, 'JOINED');

  if p_stake > 0 then
    perform public.reserve_wallet_funds(p_user_id, p_stake, 'session:' || v_session.id || ':entry:' || p_user_id);
  end if;

  return v_session;
end;
$$;

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

  if v_session.stake > 0 then
    perform public.reserve_wallet_funds(p_user_id, v_session.stake, 'session:' || v_session.id || ':entry:' || p_user_id);
  end if;

  if v_player_count + 1 = v_game.max_players then
    update public.game_sessions
      set status = 'IN_PROGRESS', started_at = now()
      where id = v_session.id
      returning * into v_session;
  end if;

  return v_session;
end;
$$;

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

  select * into v_result from public.game_results where session_id = p_session_id;
  if v_result.id is not null then
    return v_result;
  end if;
  if v_session.status = 'FINISHED' then
    raise exception 'session déjà terminée sans ligne de résultat (incohérence)';
  end if;

  v_pot := v_session.stake * (select count(*) from public.game_players where session_id = p_session_id);

  for r in
    select gp.user_id from public.game_players gp where gp.session_id = p_session_id order by gp.user_id
  loop
    perform 1 from public.wallets where user_id = r.user_id for update;
  end loop;

  if p_result_type = 'DRAW' then
    v_commission := 0;
    for r in select user_id from public.game_players where session_id = p_session_id loop
      if v_session.stake > 0 then
        update public.wallets set balance_reserved = balance_reserved - v_session.stake,
                                   balance_available = balance_available + v_session.stake,
                                   updated_at = now()
          where user_id = r.user_id;
        insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, reference)
          select id, r.user_id, 'REFUND', v_session.stake, 'COINS', 'COMPLETED',
                 'session:' || p_session_id || ':refund:' || r.user_id
          from public.wallets where user_id = r.user_id
          on conflict (type, reference) do nothing;
      end if;
    end loop;
    v_payout := 0;
  else
    v_commission := case when v_pot > 0 then round(v_pot * v_session.commission_percent / 100.0) else 0 end;
    v_payout := v_pot - v_commission;

    if v_session.stake > 0 then
      for r in select user_id from public.game_players where session_id = p_session_id loop
        update public.wallets set balance_reserved = balance_reserved - v_session.stake, updated_at = now()
          where user_id = r.user_id;
      end loop;
    end if;

    if p_winner_id is not null and v_payout > 0 then
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

-- Puissance 4 devient jouable (moteur branché ci-dessous dans le code applicatif).
update public.games set is_active = true where slug = 'puissance4';
