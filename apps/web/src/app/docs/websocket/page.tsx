import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "WebSocket feeds · Eteebaar",
  description: "Eteebaar spot exchange — WebSocket feeds.",
};

export default function Page() {
  return <StaticArticle slug="websocket" />;
}
