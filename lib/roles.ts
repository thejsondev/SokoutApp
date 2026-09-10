export type Role = "bewohner" | "hausverwaltung" | "hausmeister";

export const ROLES: Role[] = ["bewohner", "hausverwaltung", "hausmeister"];

export const ROLE_LABELS: Record<Role, string> = {
  bewohner: "Bewohner",
  hausverwaltung: "Hausverwaltung",
  hausmeister: "Hausmeister",
};

export function isRole(value: string | null | undefined): value is Role {
  return value === "bewohner" || value === "hausverwaltung" || value === "hausmeister";
}

export function isHausmeister(role: Role): boolean {
  return role === "hausmeister";
}
