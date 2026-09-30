-- COME-AND-FIGHT — écriture atomique et idempotente dans le ledger.
--
-- amount est signé : positif = crédit du solde disponible, négatif = débit.
-- L'idempotence repose sur la contrainte unique (type, reference) de
-- wallet_transactions : si la ligne existe déjà, la fonction ne touche pas
-- au solde et renvoie la ligne existante — un même appel (même callback,
-- même résultat de partie) ne peut donc jamais s'appliquer deux fois.
--
-- security definer : nécessaire pour écrire malgré RLS, mais l'exécution
-- est réservée au rôle service_role (voir grants en bas), donc jamais
-- appelable directement par un client authentifié.

create or replace function public.apply_wallet_ledger_entry(
  p_user_id uuid,
  p_type text,
  p_amount bigint,
  p_reference text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.wallet_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_row public.wallet_transactions;
begin
  select id into v_wallet_id from public.wallets where user_id = p_user_id for update;
  if v_wallet_id is null then
    raise exception 'wallet introuvable pour user_id %', p_user_id;
  end if;

  insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, reference, metadata)
  values (v_wallet_id, p_user_id, p_type, p_amount, 'COINS', 'COMPLETED', p_reference, p_metadata)
  on conflict (type, reference) do nothing
  returning * into v_row;

  if v_row.id is null then
    -- Déjà traité : on renvoie la ligne existante sans retoucher au solde.
    select * into v_row from public.wallet_transactions where type = p_type and reference = p_reference;
    return v_row;
  end if;

  update public.wallets
    set balance_available = balance_available + p_amount,
        updated_at = now()
    where id = v_wallet_id;

  return v_row;
end;
$$;

revoke execute on function public.apply_wallet_ledger_entry(uuid, text, bigint, text, jsonb) from public, authenticated, anon;
grant execute on function public.apply_wallet_ledger_entry(uuid, text, bigint, text, jsonb) to service_role;
