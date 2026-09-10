import type { Metadata } from "next";
import { TicketPageClient } from "./TicketPageClient";

export const metadata: Metadata = {
  title: "Ticket",
};

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function TicketPage() {
  return <TicketPageClient />;
}
