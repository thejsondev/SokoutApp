"use client";

import Link from "next/link";
import { TICKET_STATUS } from "@/lib/tickets";
import type { ApiTicket } from "@/lib/types";

export function TicketCard({
  ticket,
  href,
  subtitle,
  showProject = false,
}: {
  ticket: ApiTicket;
  href?: string;
  subtitle?: string;
  showProject?: boolean;
}) {
  const status = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.open;
  const preview = ticket.messages?.[0]?.body ?? "Ticket";
  const meta = subtitle ?? new Date(ticket.created_at).toLocaleDateString("de-DE");

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium text-neutral-900 dark:text-white">{preview}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {showProject && ticket.project?.title && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {ticket.project.title}
          </span>
        )}
        <p className="text-xs text-neutral-400">{meta}</p>
      </div>
    </>
  );

  const className = [
    "block rounded-[28px] border bg-white px-5 py-4 dark:bg-neutral-900",
    status.cardClassName,
  ].join(" ");

  const to = href ?? `/tickets/${ticket.id}`;
  return (
    <Link href={to} className={className}>
      {inner}
    </Link>
  );
}
