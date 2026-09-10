"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, ClipboardList, Phone, Plus, QrCode } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { HomePageSkeleton } from "@/components/ui/skeletons";
import { TicketCard } from "@/components/tickets/TicketCard";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import { useAuth } from "@/components/providers/AuthProvider";
import { isHausmeister, ROLE_LABELS } from "@/lib/roles";
import { greetingForNow, HM_PHONE, isOpenTicket } from "@/lib/tickets";
import type { ApiProject } from "@/lib/types";

function ProjectCard({ project, href }: { project: ApiProject; href: string }) {
  const memberCount = project.members?.length ?? 0;

  return (
    <Link
      href={href}
      className="block rounded-[28px] border border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-neutral-900 dark:text-white">{project.title}</p>
          <p className="mt-1 text-sm text-neutral-500">{project.address}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
          {project.hausverwaltung ? "Mit HV" : "Privat"}
        </span>
      </div>
      {memberCount > 0 && (
        <p className="mt-3 text-xs text-neutral-400">{memberCount} Bewohner</p>
      )}
    </Link>
  );
}

export function HomeView() {
  const { user } = useAuth();
  const { projects, tickets, loading } = useWorkspace();

  if (!user) return null;

  const greeting = greetingForNow();
  const header = (
    <div className="flex items-center gap-3">
      <Image src="/logo.png" alt="" width={48} height={48} className="rounded-2xl" />
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{greeting}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {user.first_name}
        </h1>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {header}
        <HomePageSkeleton
          variant={isHausmeister(user.role) ? "admin" : "resident"}
          showHeader={false}
        />
      </div>
    );
  }

  const openTickets = tickets.filter((ticket) => isOpenTicket(ticket.status));
  const doneTickets = tickets.filter((ticket) => ticket.status === "done");

  return (
    <div className="space-y-8">
      {header}

      {isHausmeister(user.role) ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Projekte" value={projects.length} />
            <Stat label="Offen" value={openTickets.length} />
            <Stat label="Erledigt" value={doneTickets.length} />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Projekte</h2>
              <Link href="/projects" className="text-sm font-medium text-[#2e9a38]">
                Alle
              </Link>
            </div>
            {projects.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Noch keine Projekte"
                hint="Lege ein Gebäude an und teile den QR-Code."
              >
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#3CB346] px-4 py-2 text-sm font-medium text-white"
                >
                  <Plus className="h-4 w-4" />
                  Projekt anlegen
                </Link>
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 3).map((project) => (
                  <ProjectCard key={project.id} project={project} href={`/projects/${project.id}`} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">Letzte Anfragen</h2>
            {tickets.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Keine Anfragen" hint="Sobald Bewohner ein Ticket öffnen, siehst du es hier." />
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 4).map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    subtitle={ticket.projectTitle}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <p className="rounded-full bg-neutral-50 px-3 py-1 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400 w-fit">
            {ROLE_LABELS[user.role]}
          </p>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">Dein Haus</h2>
            {projects.length === 0 ? (
              <EmptyState
                icon={QrCode}
                title="Noch keinem Haus beigetreten"
                hint="Scanne den QR-Code deines Hausmeisters, um loszulegen."
              />
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} href={`/projects/${project.id}`} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Anfragen</h2>
              <Link href="/service" className="text-sm font-medium text-[#2e9a38]">
                Service
              </Link>
            </div>
            {tickets.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Keine offenen Anfragen"
                hint="Melde ein Problem über Service."
              />
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 3).map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    subtitle={ticket.projectTitle}
                  />
                ))}
              </div>
            )}
          </section>

          <a
            href={`tel:${HM_PHONE}`}
            className="flex items-center justify-center gap-2 rounded-full bg-[#3CB346] py-3.5 font-medium text-white"
          >
            <Phone className="h-4 w-4" />
            Hausmeister anrufen
          </a>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] bg-neutral-50 px-3 py-4 text-center dark:bg-neutral-900">
      <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-neutral-500">{label}</p>
    </div>
  );
}
