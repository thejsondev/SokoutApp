import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, Home, ShoppingBag, Ticket, UserRound } from "lucide-react";
import type { Role } from "@/lib/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const home: NavItem = { href: "/", label: "Home", icon: Home };
const projects: NavItem = { href: "/projects", label: "Projects", icon: Building2 };
const tickets: NavItem = { href: "/tickets", label: "Tickets", icon: Ticket };
const service: NavItem = { href: "/service", label: "Service", icon: ClipboardList };
const shop: NavItem = { href: "/shop", label: "Shop", icon: ShoppingBag };
const account: NavItem = { href: "/account", label: "Konto", icon: UserRound };

export function isLockedAppPath(pathname: string): boolean {
  if (pathname.startsWith("/projects/") && pathname !== "/projects") return true;
  if (pathname.startsWith("/tickets/") && pathname !== "/tickets") return true;
  return false;
}

export function getNavItems(role: Role): NavItem[] {
  if (role === "hausmeister") {
    return [home, projects, tickets, shop, account];
  }

  return [home, service, shop, account];
}
