"use client";

import { useParams } from "next/navigation";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

export function ProjectPageClient() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  return <ProjectDetail id={id} />;
}
