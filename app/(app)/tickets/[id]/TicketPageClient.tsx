"use client";

import { useParams } from "next/navigation";
import { TicketDetail } from "@/components/tickets/TicketDetail";

export function TicketPageClient() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  return <TicketDetail id={id} />;
}
