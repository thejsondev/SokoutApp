"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { canUseDirectChat } from "@/lib/roles";

export function ChatHeaderButton() {
  const { role } = useAuth();
  if (!role || !canUseDirectChat(role)) return null;

  return (
    <Link
      href="/chats"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      aria-label="Chat"
    >
      <MessageCircle className="h-5 w-5" />
    </Link>
  );
}
