-- COME-AND-FIGHT — corrige une récursion infinie RLS entre game_sessions et
-- game_players : chaque policy interrogeait l'autre table (protégée par RLS),
-- qui réinterrogeait la première, à l'infini. Postgres le détecte et bloque
-- TOUTE lecture de ces deux tables (et de tout ce qui en dépend : game_moves,
-- game_results, messages de partie).
--
-- Fix standard pour ce cas : déplacer la vérification dans une fonction
-- SECURITY DEFINER. Les tables appartiennent au rôle qui exécute les
-- migrations (propriétaire = bypass RLS par défaut), donc la fonction lit
-- l'autre table SANS redéclencher sa policy RLS — la boucle est cassée.

create or replace function public.is_game_participant(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.game_players
    where session_id = p_session_id and user_id = p_user_id
  );
$$;

create or replace function public.game_session_is_open_or_owned(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.game_sessions
    where id = p_session_id and (status = 'WAITING' or created_by = p_user_id)
  );
$$;

grant execute on function public.is_game_participant(uuid, uuid) to authenticated;
grant execute on function public.game_session_is_open_or_owned(uuid, uuid) to authenticated;

drop policy if exists "game_sessions_select_visible" on public.game_sessions;
create policy "game_sessions_select_visible"
  on public.game_sessions for select
  to authenticated
  using (
    status = 'WAITING'
    or created_by = auth.uid()
    or public.is_game_participant(id, auth.uid())
  );

drop policy if exists "game_players_select_visible" on public.game_players;
create policy "game_players_select_visible"
  on public.game_players for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.game_session_is_open_or_owned(session_id, auth.uid())
  );
