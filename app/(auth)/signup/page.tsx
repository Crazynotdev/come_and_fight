import { AmbientBackground } from "@/components/marketing/AmbientBackground";
import { AuthForm } from "@/components/auth/AuthForm";

export default function Page() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <AmbientBackground />
      <AuthForm mode="signup" />
    </main>
  );
}
