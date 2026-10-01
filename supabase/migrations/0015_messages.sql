-- COME-AND-FIGHT — messagerie : chat de partie + messages directs entre amis.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.game_sessions(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  -- Exactement un des deux contextes : message de partie OU message direct.
  check ((session_id is not null) <> (recipient_id is not null))
);

create index if not exists messages_session_idx on public.messages(session_id, created_at);
create index if not exists messages_direct_idx on public.messages(least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_session_participants" on public.messages;
create policy "messages_select_session_participants"
  on public.messages for select
  to authenticated
  using (
    session_id is not null and exists (
      select 1 from public.game_players gp where gp.session_id = messages.session_id and gp.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_session_participants" on public.messages;
create policy "messages_insert_session_participants"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid() and session_id is not null and exists (
      select 1 from public.game_players gp where gp.session_id = messages.session_id and gp.user_id = auth.uid()
    )
  );

drop policy if exists "messages_select_direct_participants" on public.messages;
create policy "messages_select_direct_participants"
  on public.messages for select
  to authenticated
  using (recipient_id is not null and auth.uid() in (sender_id, recipient_id));

-- On ne peut écrire en DM qu'à un ami accepté — anti-spam structurel.
drop policy if exists "messages_insert_direct_to_friends" on public.messages;
create policy "messages_insert_direct_to_friends"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid() and recipient_id is not null and exists (
      select 1 from public.friendships f
      where f.status = 'ACCEPTED'
        and least(f.user_id, f.friend_id) = least(auth.uid(), recipient_id)
        and greatest(f.user_id, f.friend_id) = greatest(auth.uid(), recipient_id)
    )
  );

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships') then
    alter publication supabase_realtime add table public.friendships;
  end if;
end $$;
