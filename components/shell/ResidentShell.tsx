"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { IslandNav } from "@/components/nav/IslandNav";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getNavItems, isLockedAppPath } from "@/lib/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function ResidentShell({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const pathname = usePathname();
  const items = getNavItems(role ?? "bewohner");
  const lockPage = isLockedAppPath(pathname);

  return (
    <div className="h-dvh overflow-hidden bg-white dark:bg-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <Image
            src="/logo.png"
            alt="Sokout"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
            Sokout
          </span>
        </div>
        <SidebarNav items={items} variant="resident" />
        <div className="mt-auto">
          <LogoutButton variant="resident" />
        </div>
      </aside>

      <main className="h-dvh md:pl-60">
        <div
          className={[
            "mx-auto h-full min-h-0 w-full max-w-2xl px-5 pt-6 md:px-8 md:pt-10",
            "pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] md:pb-10",
            lockPage ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          ].join(" ")}
        >
          {children}
        </div>
      </main>

      <div className="md:hidden">
        <IslandNav items={items} variant="resident" />
      </div>
    </div>
  );
}
