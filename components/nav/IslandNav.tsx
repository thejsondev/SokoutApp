"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

type Variant = "resident" | "admin";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function IslandNav({
  items,
  variant,
}: {
  items: NavItem[];
  variant: Variant;
}) {
  const pathname = usePathname();
  const admin = variant === "admin";

  return (
    <nav
      className={[
        "fixed left-1/2 z-50 flex w-[min(96vw,28rem)] -translate-x-1/2 items-stretch justify-around px-1 py-2",
        "rounded-[28px] border shadow-[0_12px_40px_rgba(0,0,0,0.14)]",
        "bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]",
        admin
          ? "border-white/10 bg-neutral-950/95 text-white backdrop-blur-xl"
          : "border-black/5 bg-white/90 text-neutral-500 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95",
      ].join(" ")}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition",
              active
                ? "text-[#3CB346]"
                : "text-neutral-400",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
