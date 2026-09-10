"use client";

import { JoinProject } from "@/components/projects/JoinProject";
import { usePathParam } from "@/lib/usePathParam";

export function JoinPageClient() {
  const token = usePathParam("join");
  if (!token || token === "__") return null;
  return <JoinProject token={token} />;
}
