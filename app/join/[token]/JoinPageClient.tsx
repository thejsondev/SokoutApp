"use client";

import { useParams } from "next/navigation";
import { JoinProject } from "@/components/projects/JoinProject";

export function JoinPageClient() {
  const params = useParams<{ token: string }>();
  const token = String(params.token ?? "");
  return <JoinProject token={token} />;
}
