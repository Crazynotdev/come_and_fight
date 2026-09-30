import { AmbientBackground } from "@/components/marketing/AmbientBackground";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function Page() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <AmbientBackground />
      <ForgotPasswordForm />
    </main>
  );
}
