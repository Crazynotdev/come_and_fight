import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:pt-10">
      <PageHeader title={slug.charAt(0).toUpperCase() + slug.slice(1)} />
      <EmptyState Icon={Hammer} title="Salle de jeu en construction" text="Le matchmaking et le plateau arrivent à la prochaine étape." />
    </div>
  );
}
