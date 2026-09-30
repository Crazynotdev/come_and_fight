-- COME-AND-FIGHT — rate-limit fiable sur Vercel (serverless multi-instance).
-- L'ancienne version en mémoire (Map JS) ne tenait que par instance de
-- fonction : sur Vercel, deux requêtes simultanées peuvent atterrir sur deux
-- conteneurs différents qui ne partagent rien. Ici, la contrainte est
-- appliquée en base, donc valable quel que soit le nombre d'instances.

create table public.rate_limit_hits (
  key text primary key,
  last_hit_at timestamptz not null default now()
);

-- true = trop rapide (à bloquer), false = autorisé (et horodatage mis à jour).
create or replace function public.check_rate_limit(p_key text, p_min_interval_ms integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nettoyage opportuniste (pas de cron nécessaire) : ~1 appel sur 200.
  if random() < 0.005 then
    delete from public.rate_limit_hits where last_hit_at < now() - interval '1 hour';
  end if;

  update public.rate_limit_hits
    set last_hit_at = now()
    where key = p_key and last_hit_at < now() - (p_min_interval_ms || ' milliseconds')::interval;
  if found then
    return false;
  end if;

  insert into public.rate_limit_hits (key, last_hit_at)
  values (p_key, now())
  on conflict (key) do nothing;
  if found then
    return false;
  end if;

  return true;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer) from public, authenticated, anon;
grant execute on function public.check_rate_limit(text, integer) to service_role;
