import type { ApiTicket, TicketStatus } from "@/lib/types";

export const HM_PHONE = "+498912345678";

export function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function isOpenTicket(status: TicketStatus): boolean {
  return status !== "done";
}

export type StatusFilter = "all" | "active" | TicketStatus;
export type SortOrder = "newest" | "oldest";

export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "active", label: "Offen" },
  { id: "open", label: "Anfrage" },
  { id: "qa", label: "Frage & Antwort" },
  { id: "awaiting_appointment", label: "Termin" },
  { id: "referred", label: "Weitergeleitet" },
  { id: "done", label: "Erledigt" },
];

export function filterAndSortTickets(
  tickets: ApiTicket[],
  statusFilter: StatusFilter,
  sortOrder: SortOrder,
): ApiTicket[] {
  const filtered = tickets.filter((ticket) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return isOpenTicket(ticket.status);
    return ticket.status === statusFilter;
  });

  return [...filtered].sort((a, b) => {
    const delta = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === "newest" ? -delta : delta;
  });
}

export const TICKET_STATUS: Record<
  TicketStatus,
  { label: string; className: string; cardClassName: string }
> = {
  open: {
    label: "Anfrage",
    className: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300",
    cardClassName: "border-red-300 bg-white dark:border-red-500/40 dark:bg-neutral-900",
  },
  qa: {
    label: "Frage & Antwort",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300",
    cardClassName: "border-sky-300 bg-white dark:border-sky-500/40 dark:bg-neutral-900",
  },
  awaiting_appointment: {
    label: "Termin ausstehend",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    cardClassName: "border-amber-300 bg-white dark:border-amber-500/40 dark:bg-neutral-900",
  },
  referred: {
    label: "Weitergeleitet",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    cardClassName: "border-emerald-300 bg-white dark:border-emerald-500/40 dark:bg-neutral-900",
  },
  done: {
    label: "Erledigt",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    cardClassName: "border-emerald-300 bg-white dark:border-emerald-500/40 dark:bg-neutral-900",
  },
};
