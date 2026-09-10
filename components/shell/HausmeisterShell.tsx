"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { IslandNav } from "@/components/nav/IslandNav";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getNavItems, isLockedAppPath } from "@/lib/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function HausmeisterShell({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const pathname = usePathname();
  const items = getNavItems(role ?? "hausmeister");
  const lockPage = isLockedAppPath(pathname);

  return (
    <div className="h-dvh overflow-hidden bg-white dark:bg-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-neutral-950 md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <Image
            src="/logo.png"
            alt="Sokout"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight text-white">Sokout</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#3CB346]">
              Admin
            </p>
          </div>
        </div>
        <SidebarNav items={items} variant="admin" />
        <div className="mt-auto">
          <LogoutButton variant="admin" />
        </div>
      </aside>

      <main className="flex h-dvh flex-col md:pl-64">
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800 md:px-8 md:py-4">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Hausmeister</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Admin-Bereich</p>
          </div>
        </header>
        <div
          className={[
            "mx-auto min-h-0 w-full max-w-5xl flex-1 px-5 pt-6 md:px-8 md:pt-8",
            "pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] md:pb-10",
            lockPage ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          ].join(" ")}
        >
          {children}
        </div>
      </main>

      <div className="md:hidden">
        <IslandNav items={items} variant="admin" />
      </div>
    </div>
  );
}
