"use client";

import { PresenceLogView } from "@/components/projects/PresenceLogView";
import { usePathParam } from "@/lib/usePathParam";

export function PresencePageClient() {
  const id = usePathParam("project");
  if (!id || id === "__") return null;
  return <PresenceLogView projectId={id} />;
}
