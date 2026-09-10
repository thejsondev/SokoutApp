"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiProject, ApiTicket } from "@/lib/types";

export type TicketWithProject = ApiTicket & {
  projectTitle: string;
};

export function useWorkspace() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [tickets, setTickets] = useState<TicketWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const payload = await api<{ data: ApiProject[] }>("/projects");
      const nextProjects = payload.data;
      setProjects(nextProjects);

      const perProject = await Promise.all(
        nextProjects.map(async (project) => {
          const ticketsPayload = await api<{ data: ApiTicket[] }>(`/projects/${project.id}/tickets`);
          return ticketsPayload.data.map((ticket) => ({
            ...ticket,
            projectTitle: project.title,
          }));
        }),
      );

      setTickets(
        perProject
          .flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );
    } catch {
      setProjects([]);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { projects, tickets, loading, reload };
}
