-- COME-AND-FIGHT — Phase 1 : trigger d'inscription
-- À l'inscription (auth.users), on crée automatiquement :
--   1. le profil (avec un player_id unique du type CF-XXXXX) ;
--   2. le wallet associé (solde 0).
-- security definer : nécessaire pour écrire dans public.* depuis un trigger
-- déclenché sur le schéma auth.

create or replace function public.generate_player_id()
returns text
language plpgsql
as $$
declare
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'CF-' || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    select exists(select 1 from public.profiles where player_id = candidate) into exists_already;
    exit when not exists_already;
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix integer := 0;
begin
  base_username := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data->>'username', '[^a-zA-Z0-9_]', '', 'g'), ''),
    'joueur' || substr(new.id::text, 1, 6)
  );
  final_username := base_username;

  -- Garantit l'unicité du pseudo sans faire échouer l'inscription.
  while exists(select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, player_id)
  values (new.id, final_username, public.generate_player_id());

  insert into public.wallets (user_id, balance_available, balance_reserved)
  values (new.id, 0, 0);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
