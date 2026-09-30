-- COME-AND-FIGHT — mise à jour automatique des stats joueur (profil, classement)
-- à chaque partie réglée. Sans ce trigger, wins/losses/games_played restaient
-- à 0 pour toujours : le profil et le classement affichaient des données
-- fausses malgré des parties réellement jouées.

create or replace function public.apply_profile_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
    set games_played = games_played + 1,
        wins = wins + case when p.id = new.winner_id then 1 else 0 end,
        losses = losses + case when new.winner_id is not null and p.id <> new.winner_id then 1 else 0 end,
        updated_at = now()
    where p.id in (select gp.user_id from public.game_players gp where gp.session_id = new.session_id);
  return new;
end;
$$;

drop trigger if exists on_game_result_update_stats on public.game_results;
create trigger on_game_result_update_stats
  after insert on public.game_results
  for each row execute function public.apply_profile_stats();
