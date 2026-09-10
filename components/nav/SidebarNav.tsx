"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

type Variant = "resident" | "admin";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  items,
  variant,
}: {
  items: NavItem[];
  variant: Variant;
}) {
  const pathname = usePathname();
  const admin = variant === "admin";

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
              admin
                ? active
                  ? "bg-[#3CB346] text-white"
                  : "text-neutral-300 hover:bg-white/10 hover:text-white"
                : active
                  ? "bg-[#3CB346]/12 text-[#2e9a38]"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white",
            ].join(" ")}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
