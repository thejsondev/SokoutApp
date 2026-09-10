import { Suspense } from "react";
import { LoginFlow } from "@/components/auth/LoginFlow";
import { AuthCardSkeleton } from "@/components/ui/skeletons";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginFlow />
    </Suspense>
  );
}
