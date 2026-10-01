-- COME-AND-FIGHT — XP, niveaux, streaks. Calculés automatiquement à chaque
-- partie réglée (même trigger que les stats), jamais modifiables par le client.

alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists streak_count integer not null default 0,
  add column if not exists last_played_on date;

-- Palier simple et lisible : niveau N atteint à N*(N-1)*50 XP (100, 300, 600, 1000, ...).
create or replace function public.level_for_xp(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor((1 + sqrt(1 + p_xp::numeric / 12.5)) / 2)::integer);
$$;

create or replace function public.apply_profile_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_xp_gain integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  for r in select gp.user_id from public.game_players gp where gp.session_id = new.session_id loop
    v_xp_gain := case
      when new.winner_id = r.user_id then 30
      when new.result_type = 'DRAW' then 10
      else 5
    end;

    update public.profiles p set
      games_played = games_played + 1,
      wins = wins + case when p.id = new.winner_id then 1 else 0 end,
      losses = losses + case when new.winner_id is not null and p.id <> new.winner_id then 1 else 0 end,
      xp = xp + v_xp_gain,
      level = public.level_for_xp(xp + v_xp_gain),
      streak_count = case
        when p.last_played_on = v_today then p.streak_count
        when p.last_played_on = v_today - 1 then p.streak_count + 1
        else 1
      end,
      last_played_on = v_today,
      updated_at = now()
    where p.id = r.user_id;
  end loop;
  return new;
end;
$$;
-- Le trigger on_game_result_update_stats (migration 0011) pointe déjà vers
-- cette fonction — create or replace suffit, pas besoin de recréer le trigger.
