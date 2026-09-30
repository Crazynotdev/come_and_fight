-- COME-AND-FIGHT — annulation d'une session WAITING (le créateur se retire avant
-- qu'un adversaire n'ait rejoint). Rembourse sa mise réservée.

create or replace function public.cancel_waiting_session(p_session_id uuid, p_user_id uuid)
returns public.game_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.game_sessions;
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;
  if v_session.id is null then
    raise exception 'session introuvable';
  end if;
  if v_session.status <> 'WAITING' then
    raise exception 'seule une partie en attente peut être annulée';
  end if;
  if v_session.created_by <> p_user_id then
    raise exception 'seul le créateur peut annuler cette partie';
  end if;

  update public.wallets
    set balance_reserved = balance_reserved - v_session.stake,
        balance_available = balance_available + v_session.stake,
        updated_at = now()
    where user_id = p_user_id;

  insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, reference)
    select id, p_user_id, 'REFUND', v_session.stake, 'COINS', 'COMPLETED', 'session:' || p_session_id || ':cancel'
    from public.wallets where user_id = p_user_id
    on conflict (type, reference) do nothing;

  update public.game_sessions set status = 'CANCELLED' where id = p_session_id returning * into v_session;
  return v_session;
end;
$$;

revoke execute on function public.cancel_waiting_session(uuid, uuid) from public, authenticated, anon;
grant execute on function public.cancel_waiting_session(uuid, uuid) to service_role;
