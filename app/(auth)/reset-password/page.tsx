import { AmbientBackground } from "@/components/marketing/AmbientBackground";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function Page() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <AmbientBackground />
      <ResetPasswordForm />
    </main>
  );
}
