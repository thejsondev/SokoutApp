import type { Metadata } from "next";
import { ChatPageClient } from "./ChatPageClient";

export const metadata: Metadata = {
  title: "Chat",
};

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function ChatPage() {
  return <ChatPageClient />;
}
