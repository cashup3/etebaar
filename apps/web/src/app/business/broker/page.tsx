import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Broker tools · Etebaar",
  description: "Etebaar spot exchange — Broker tools.",
};

export default function Page() {
  return <StaticArticle slug="bizBroker" />;
}
