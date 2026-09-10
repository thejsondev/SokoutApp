"use client";

import { useParams, usePathname } from "next/navigation";

function readPathParam(pathname: string, kind: "project" | "ticket" | "join"): string {
  const parts = pathname.split("/").filter(Boolean);
  if (kind === "join") {
    const i = parts.indexOf("join");
    return i >= 0 ? (parts[i + 1] ?? "") : "";
  }
  if (kind === "project") {
    const i = parts.indexOf("projects");
    return i >= 0 ? (parts[i + 1] ?? "") : "";
  }
  const i = parts.indexOf("tickets");
  return i >= 0 ? (parts[i + 1] ?? "") : "";
}

/**
 * On static Apache hosting, dynamic routes are served from a placeholder
 * page (`/projects/__/`). `useParams()` can then return `__` instead of the
 * real URL segment — so we prefer the live pathname.
 */
export function usePathParam(kind: "project" | "ticket" | "join"): string {
  const pathname = usePathname() || "";
  const params = useParams<{ id?: string; token?: string }>();
  const fromRouter = String(
    kind === "join" ? (params.token ?? "") : (params.id ?? ""),
  );
  const fromPath = readPathParam(pathname, kind);

  if (fromPath && fromPath !== "__") return fromPath;
  if (fromRouter && fromRouter !== "__") return fromRouter;
  return fromPath || fromRouter;
}
