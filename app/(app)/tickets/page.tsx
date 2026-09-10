import type { Metadata } from "next";
import { AllTicketsView } from "@/components/tickets/AllTicketsView";

export const metadata: Metadata = {
  title: "Tickets",
};

export default function TicketsPage() {
  return <AllTicketsView />;
}
