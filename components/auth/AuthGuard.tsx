"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppBootSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading || user) return;

    const next = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, user, pathname, router, searchParams]);

  if (loading || !user) {
    return <AppBootSkeleton />;
  }

  return <>{children}</>;
}
