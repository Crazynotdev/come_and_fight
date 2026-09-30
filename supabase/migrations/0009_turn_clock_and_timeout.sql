-- COME-AND-FIGHT — horloge de tour + forfait pour timeout, vérifiés côté serveur.
-- Le délai est stocké par jeu (games.turn_timeout_seconds), jamais fourni par le client.

alter table public.games add column turn_timeout_seconds integer not null default 60;
alter table public.game_sessions add column turn_started_at timestamptz;

update public.game_sessions set turn_started_at = started_at where started_at is not null;

create or replace function public.claim_timeout_forfeit(p_session_id uuid, p_claimant_id uuid)
returns public.game_results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
  v_game public.games;
  v_claimant_seat public.game_players;
  v_turn_user_id uuid;
  v_opponent_id uuid;
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;
  if v_session.id is null then raise exception 'session introuvable'; end if;
  if v_session.status <> 'IN_PROGRESS' then raise exception 'cette partie n''est pas en cours'; end if;

  select * into v_game from public.games where id = v_session.game_id;

  if v_session.turn_started_at is null or
     v_session.turn_started_at + make_interval(secs => v_game.turn_timeout_seconds) > now() then
    raise exception 'le délai n''est pas encore écoulé';
  end if;

  select gp.* into v_claimant_seat from public.game_players gp
    where gp.session_id = p_session_id and gp.user_id = p_claimant_id;
  if v_claimant_seat.id is null then raise exception 'tu ne fais pas partie de cette partie'; end if;

  -- Le joueur dont c'est le tour (celui qui a laissé filer le temps) : seat 1 si turn=1, seat 2 si turn=-1.
  select gp.user_id into v_turn_user_id from public.game_players gp
    where gp.session_id = p_session_id and gp.seat = (case when v_session.turn = 1 then 1 else 2 end);

  if v_turn_user_id = p_claimant_id then
    raise exception 'c''est ton tour : tu ne peux pas réclamer un forfait';
  end if;

  select gp.user_id into v_opponent_id from public.game_players gp
    where gp.session_id = p_session_id and gp.user_id <> v_turn_user_id;

  return public.settle_game_session(p_session_id, v_opponent_id, 'TIMEOUT');
end;
$$;

revoke execute on function public.claim_timeout_forfeit(uuid, uuid) from public, authenticated, anon;
grant execute on function public.claim_timeout_forfeit(uuid, uuid) to service_role;
