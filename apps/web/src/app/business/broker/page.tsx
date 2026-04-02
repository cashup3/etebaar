import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Broker tools · Eteebaar",
  description: "Eteebaar spot exchange — Broker tools.",
};

export default function Page() {
  return <StaticArticle slug="bizBroker" />;
}
