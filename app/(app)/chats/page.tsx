import type { Metadata } from "next";
import { ChatList } from "@/components/chat/ChatList";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatsPage() {
  return <ChatList />;
}
