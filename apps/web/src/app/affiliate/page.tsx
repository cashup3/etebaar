import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Affiliate program · Eteebaar",
  description: "Eteebaar spot exchange — Affiliate program.",
};

export default function Page() {
  return <StaticArticle slug="affiliate" />;
}
