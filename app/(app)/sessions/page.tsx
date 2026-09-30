import { Swords } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:pt-10">
      <PageHeader title="Parties" subtitle="Crée ou rejoins un duel." />
      <EmptyState Icon={Swords} title="Aucune partie en cours" text="Lance une partie depuis la page Jeux ou rejoins-en une avec un code." />
    </div>
  );
}
