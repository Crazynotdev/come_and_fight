import { getCurrentPlayer } from "@/lib/server/session";
import { NotificationsClient, type Notif } from "@/components/notifications/NotificationsClient";

export default async function NotificationsPage() {
  const { supabase, userId } = await getCurrentPlayer();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationsClient items={(data ?? []) as Notif[]} />;
}
