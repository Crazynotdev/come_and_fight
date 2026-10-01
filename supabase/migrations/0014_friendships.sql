-- COME-AND-FIGHT — système d'amis (demande / acceptation / suppression).

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
  created_at timestamptz not null default now(),
  check (user_id <> friend_id)
);

-- Une seule relation par paire, peu importe le sens.
create unique index if not exists friendships_pair_unique
  on public.friendships (least(user_id, friend_id), greatest(user_id, friend_id));

create index if not exists friendships_user_id_idx on public.friendships(user_id);
create index if not exists friendships_friend_id_idx on public.friendships(friend_id);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships for select
  to authenticated
  using (auth.uid() in (user_id, friend_id));

drop policy if exists "friendships_insert_request" on public.friendships;
create policy "friendships_insert_request"
  on public.friendships for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'PENDING');

-- Seul le destinataire peut répondre (accepter/refuser) à une demande.
drop policy if exists "friendships_update_respond" on public.friendships;
create policy "friendships_update_respond"
  on public.friendships for update
  to authenticated
  using (friend_id = auth.uid() and status = 'PENDING')
  with check (status in ('ACCEPTED', 'DECLINED'));

-- Les deux parties peuvent supprimer la relation (retirer un ami, annuler/refuser une demande).
drop policy if exists "friendships_delete_either_party" on public.friendships;
create policy "friendships_delete_either_party"
  on public.friendships for delete
  to authenticated
  using (auth.uid() in (user_id, friend_id));
