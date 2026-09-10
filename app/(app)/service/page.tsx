import type { Metadata } from "next";
import { ServiceView } from "@/components/service/ServiceView";

export const metadata: Metadata = {
  title: "Service",
};

export default function ServicePage() {
  return <ServiceView />;
}
