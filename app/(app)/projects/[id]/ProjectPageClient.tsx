"use client";

import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { usePathParam } from "@/lib/usePathParam";

export function ProjectPageClient() {
  const id = usePathParam("project");
  if (!id || id === "__") return null;
  return <ProjectDetail id={id} />;
}
