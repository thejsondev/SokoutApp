"use client";

import { ChatThread } from "@/components/chat/ChatThread";
import { usePathParam } from "@/lib/usePathParam";

export function ChatPageClient() {
  const id = usePathParam("chat");
  if (!id || id === "__") return null;
  return <ChatThread id={id} />;
}
