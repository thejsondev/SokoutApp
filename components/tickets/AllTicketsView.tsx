"use client";

import { ArrowDownNarrowWide, ArrowUpNarrowWide, Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CreateTicketModal } from "@/components/projects/CreateTicketModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ServicePageSkeleton } from "@/components/ui/skeletons";
import { TicketCard } from "@/components/tickets/TicketCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { isHausmeister } from "@/lib/roles";
import {
  filterAndSortTickets,
  STATUS_FILTERS,
  type SortOrder,
  type StatusFilter,
} from "@/lib/tickets";
import type { ApiProject, ApiTicket } from "@/lib/types";

export function AllTicketsView() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  useEffect(() => {
    if (user && !isHausmeister(user.role)) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isHausmeister(user.role)) return;

    void Promise.all([
      api<{ data: ApiTicket[] }>("/tickets")
        .then((payload) => setTickets(payload.data))
        .catch(() => setTickets([])),
      api<{ data: ApiProject[] }>("/projects")
        .then((payload) => setProjects(payload.data))
        .catch(() => setProjects([])),
    ]).finally(() => setLoading(false));
  }, [user]);

  const visibleTickets = useMemo(
    () => filterAndSortTickets(tickets, statusFilter, sortOrder),
    [tickets, statusFilter, sortOrder],
  );

  if (!user || !isHausmeister(user.role) || loading) {
    return <ServicePageSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Tickets</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Alle Anfragen, projektübergreifend</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {sortOrder === "newest" ? (
              <ArrowDownNarrowWide className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpNarrowWide className="h-3.5 w-3.5" />
            )}
            {sortOrder === "newest" ? "Neueste" : "Älteste"}
          </button>
          <button
            type="button"
            onClick={() => setTicketOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#3CB346] px-3.5 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Neu
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                active
                  ? "bg-[#3CB346] text-white"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {tickets.length === 0 ? (
          <EmptyState icon={Ticket} title="Keine Tickets" hint="Sobald Anfragen kommen, siehst du sie hier." />
        ) : visibleTickets.length === 0 ? (
          <EmptyState icon={Ticket} title="Keine Treffer" hint="Für diesen Filter gibt es keine Tickets." />
        ) : (
          visibleTickets.map((ticket) => {
            const who = ticket.user
              ? `${ticket.user.first_name} ${ticket.user.last_name}`
              : null;
            const date = new Date(ticket.created_at).toLocaleDateString("de-DE");

            return (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                href={`/tickets/${ticket.id}`}
                showProject
                subtitle={who ? `${who} · ${date}` : date}
              />
            );
          })
        )}
      </div>

      <CreateTicketModal
        open={ticketOpen}
        projects={projects}
        onClose={() => setTicketOpen(false)}
        onCreated={(ticket) => setTickets((current) => [ticket, ...current])}
      />
    </div>
  );
}
