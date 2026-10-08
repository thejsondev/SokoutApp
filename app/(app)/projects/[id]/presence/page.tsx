import type { Metadata } from "next";
import { PresencePageClient } from "./PresencePageClient";

export const metadata: Metadata = {
  title: "Kommen & Gehen",
};

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function PresencePage() {
  return <PresencePageClient />;
}
