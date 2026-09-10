"use client";

import { HausmeisterShell } from "@/components/shell/HausmeisterShell";
import { ResidentShell } from "@/components/shell/ResidentShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { isHausmeister } from "@/lib/roles";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();

  if (role && isHausmeister(role)) {
    return <HausmeisterShell>{children}</HausmeisterShell>;
  }

  return <ResidentShell>{children}</ResidentShell>;
}
