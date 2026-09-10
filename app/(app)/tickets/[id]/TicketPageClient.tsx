"use client";

import { TicketDetail } from "@/components/tickets/TicketDetail";
import { usePathParam } from "@/lib/usePathParam";

export function TicketPageClient() {
  const id = usePathParam("ticket");
  if (!id || id === "__") return null;
  return <TicketDetail id={id} />;
}
