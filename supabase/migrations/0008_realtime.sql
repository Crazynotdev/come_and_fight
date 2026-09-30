-- COME-AND-FIGHT — active la réplication Realtime sur les tables nécessaires
-- au plateau de jeu en direct (mise à jour du plateau, arrivée d'un adversaire).

alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.game_players;
