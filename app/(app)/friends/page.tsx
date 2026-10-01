import { PageHeader } from "@/components/ui/PageHeader";
import { FriendsClient } from "@/components/friends/FriendsClient";
import { getCurrentPlayer } from "@/lib/server/session";

export default async function FriendsPage() {
  const { userId } = await getCurrentPlayer();
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6 md:pt-10">
      <PageHeader title="Amis" />
      <FriendsClient meId={userId} />
    </div>
  );
}
