import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:pt-10">
      <PageHeader title="Statistiques" subtitle="Ta progression." />
      <EmptyState Icon={BarChart3} title="Pas encore de statistiques" text="Joue ta première partie pour voir tes victoires et ton taux de réussite." />
    </div>
  );
}
