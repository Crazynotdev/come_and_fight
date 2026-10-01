import { PageHeader } from "@/components/ui/PageHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function DirectMessagePage({ params }: { params: Promise<{ friendId: string }> }) {
  const { friendId } = await params;
  const { userId, supabase } = await getCurrentPlayer();
  const { data: friend } = await supabase.from("profiles").select("username").eq("id", friendId).single();

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-2xl flex-col px-4 pt-6 md:h-[calc(100vh-4rem)] md:pt-10">
      <PageHeader title={friend?.username ?? "Conversation"} />
      <div className="mt-4 flex-1 overflow-hidden rounded-glass border border-glass-border bg-glass-surface backdrop-blur-glass">
        <ChatThread meId={userId} recipientId={friendId} />
      </div>
    </div>
  );
}
