"use client";

import { ClipboardList, Phone, Plus, QrCode } from "lucide-react";
import { useState } from "react";
import { CreateTicketModal } from "@/components/projects/CreateTicketModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TicketSkeleton } from "@/components/ui/skeletons";
import { TicketCard } from "@/components/tickets/TicketCard";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import { useAuth } from "@/components/providers/AuthProvider";
import { HM_PHONE } from "@/lib/tickets";

export function ServiceView() {
  const { user } = useAuth();
  const { projects, tickets, loading, reload } = useWorkspace();
  const [ticketOpen, setTicketOpen] = useState(false);

  if (!user) return null;

  const project = projects[0];
  const canCreate = Boolean(project);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Service</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Anfragen an deinen Hausmeister
          </p>
        </div>
        {canCreate && (
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

      <a
        href={`tel:${HM_PHONE}`}
        className="flex items-center justify-between rounded-[28px] border border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">Hausmeister anrufen</p>
          <p className="mt-0.5 text-sm text-neutral-500">Direkt erreichen</p>
        </div>
        <span className="rounded-full bg-[#3CB346] p-2.5 text-white">
          <Phone className="h-4 w-4" />
        </span>
      </a>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">Deine Tickets</h2>
        {loading ? (
          <div className="space-y-3">
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
          </div>
        ) : !project ? (
          <EmptyState
            icon={QrCode}
            title="Noch keinem Haus beigetreten"
            hint="Scanne den QR-Code, dann kannst du Anfragen stellen."
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Noch keine Anfragen"
            hint="Heizung, Wasser, Schloss — sag Bescheid, wenn etwas nicht stimmt."
          >
            <button
              type="button"
              onClick={() => setTicketOpen(true)}
              className="rounded-full bg-[#3CB346] px-4 py-2 text-sm font-medium text-white"
            >
              Ticket erstellen
            </button>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
              />
            ))}
          </div>
        )}
      </section>

      {canCreate && project && (
        <CreateTicketModal
          open={ticketOpen}
          projectId={project.id}
          onClose={() => setTicketOpen(false)}
          onCreated={() => void reload()}
        />
      )}
    </div>
  );
}
