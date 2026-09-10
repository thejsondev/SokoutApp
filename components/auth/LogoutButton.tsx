"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export function LogoutButton({ variant = "resident" }: { variant?: "resident" | "admin" }) {
  const { logout } = useAuth();
  const admin = variant === "admin";

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className={[
        "mx-3 mb-4 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium",
        admin
          ? "text-neutral-400 hover:bg-white/10 hover:text-white"
          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white",
      ].join(" ")}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
