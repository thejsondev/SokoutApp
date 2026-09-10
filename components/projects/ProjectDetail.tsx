"use client";

import { ArrowDownNarrowWide, ArrowUpNarrowWide, Building2, MapPin, Phone, Plus, QrCode, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreateTicketModal } from "@/components/projects/CreateTicketModal";
import { QrModal } from "@/components/projects/QrModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectDetailSkeleton } from "@/components/ui/skeletons";
import { TicketCard } from "@/components/tickets/TicketCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, unwrapData } from "@/lib/api";
import { isHausmeister } from "@/lib/roles";
import {
  filterAndSortTickets,
  HM_PHONE,
  isOpenTicket,
  STATUS_FILTERS,
  type SortOrder,
  type StatusFilter,
} from "@/lib/tickets";
import type { ApiProject, ApiTicket } from "@/lib/types";

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function ProjectDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [bewohnerOpen, setBewohnerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const hm = user ? isHausmeister(user.role) : false;
  const canCreateTicket = Boolean(user);

  useEffect(() => {
    setLoading(true);
    const projectRequest = api<{ data: ApiProject }>(`/projects/${id}`)
      .then((payload) => setProject(unwrapData(payload)))
      .catch(() => setProject(null));

    const ticketsRequest = api<{ data: ApiTicket[] }>(`/projects/${id}/tickets`)
      .then((payload) => setTickets(payload.data))
      .catch(() => setTickets([]));

    void Promise.all([projectRequest, ticketsRequest]).finally(() => setLoading(false));
  }, [id]);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const bewohnerUrl = project?.join_token ? `${origin}/join/${project.join_token}` : "";
  const hausverwaltungUrl = project?.hv_join_token
    ? `${origin}/join/${project.hv_join_token}`
    : undefined;

  const mapsUrl = useMemo(() => {
    if (!project) return "#";
    if (project.latitude && project.longitude) {
      return `https://maps.google.com/?q=${project.latitude},${project.longitude}`;
    }
    return `https://maps.google.com/?q=${encodeURIComponent(project.address)}`;
  }, [project]);

  const visibleTickets = useMemo(
    () => filterAndSortTickets(tickets, statusFilter, sortOrder),
    [tickets, statusFilter, sortOrder],
  );

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return <p className="text-neutral-400">Projekt nicht gefunden.</p>;
  }

  const openCount = tickets.filter((ticket) => isOpenTicket(ticket.status)).length;
  const bewohner = (project.members ?? []).filter((member) => member.role === "bewohner");
  const memberCount = bewohner.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      <div className="shrink-0 space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              {project.title}
            </h1>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {project.hausverwaltung ? "Mit Hausverwaltung" : "Privat"}
            </span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-4">
            <p className="min-w-0 flex-1 text-left text-neutral-500">{project.address}</p>
            <div className="flex shrink-0 items-center gap-2">
              {hm && (
                <>
                  <button
                    type="button"
                    onClick={() => setQrOpen(true)}
                    className="rounded-full bg-neutral-100 p-2.5 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                    aria-label="QR-Code"
                  >
                    <QrCode className="h-5 w-5" />
                  </button>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-neutral-100 p-2.5 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                    aria-label="Karte"
                  >
                    <MapPin className="h-5 w-5" />
                  </a>
                </>
              )}
              {!hm && (
                <a
                  href={`tel:${HM_PHONE}`}
                  className="rounded-full bg-[#3CB346] p-2.5 text-white"
                  aria-label="Anrufen"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {hm && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBewohnerOpen(true)}
              className="rounded-[24px] bg-neutral-50 px-4 py-4 text-left dark:bg-neutral-900"
            >
              <Users className="h-4 w-4 text-[#3CB346]" />
              <p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">{memberCount}</p>
              <p className="text-xs text-neutral-500">Bewohner</p>
            </button>
            <div className="rounded-[24px] bg-neutral-50 px-4 py-4 dark:bg-neutral-900">
              <Building2 className="h-4 w-4 text-[#3CB346]" />
              <p className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">{openCount}</p>
              <p className="text-xs text-neutral-500">Offene Tickets</p>
            </div>
          </div>
        )}

        {project.hausverwaltung && (
          <section className="rounded-[28px] border border-neutral-100 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#2e9a38]">Hausverwaltung</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
              {project.hausverwaltung.first_name} {project.hausverwaltung.last_name}
            </p>
            <p className="mt-1 text-sm text-neutral-500">{project.hausverwaltung.email}</p>
            {project.hausverwaltung.phone && (
              <a
                href={`tel:${project.hausverwaltung.phone}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#2e9a38]"
              >
                <Phone className="h-4 w-4" />
                {project.hausverwaltung.phone}
              </a>
            )}
            {project.hausverwaltung.address && (
              <p className="mt-2 text-sm text-neutral-500">{project.hausverwaltung.address}</p>
            )}
          </section>
        )}

      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Tickets</h2>
          <div className="flex items-center gap-2">
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
            {canCreateTicket && (
              <button
                type="button"
                onClick={() => setTicketOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-[#3CB346] px-3.5 py-2 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Neu
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto pb-1">
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

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
          {tickets.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Noch keine Tickets"
              hint={
                canCreateTicket
                  ? "Melde ein Problem, wenn etwas nicht stimmt."
                  : "Hier erscheinen Anfragen der Bewohner."
              }
            />
          ) : visibleTickets.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Keine Treffer"
              hint="Für diesen Filter gibt es keine Tickets."
            />
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
                  subtitle={hm && who ? `${who} · ${date}` : date}
                />
              );
            })
          )}
        </div>
      </section>

      {hm && (
        <QrModal
          open={qrOpen}
          title={project.title}
          bewohnerUrl={bewohnerUrl}
          hausverwaltungUrl={hausverwaltungUrl}
          onClose={() => setQrOpen(false)}
        />
      )}

      {hm && bewohnerOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center"
          onClick={() => setBewohnerOpen(false)}
        >
          <div
            className="flex max-h-[80dvh] w-full max-w-lg flex-col overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Bewohner</h2>
              <button
                type="button"
                onClick={() => setBewohnerOpen(false)}
                className="text-sm text-neutral-500"
              >
                Schließen
              </button>
            </div>
            {bewohner.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Noch keine Bewohner"
                hint="Teile den QR-Code, damit Bewohner beitreten können."
              />
            ) : (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {bewohner.map((member) => (
                  <article
                    key={member.id}
                    className="flex items-center gap-3 rounded-[24px] border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3CB346]/12 text-sm font-semibold text-[#2e9a38]">
                      {initials(member.first_name, member.last_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="truncate text-sm text-neutral-500">{member.email}</p>
                      {member.phone && <p className="text-xs text-neutral-400">{member.phone}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {canCreateTicket && (
        <CreateTicketModal
          open={ticketOpen}
          projectId={project.id}
          onClose={() => setTicketOpen(false)}
          onCreated={(ticket) => setTickets((current) => [ticket, ...current])}
        />
      )}
    </div>
  );
}
