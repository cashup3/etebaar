import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Affiliate program · Etebaar",
  description: "Etebaar spot exchange — Affiliate program.",
};

export default function Page() {
  return <StaticArticle slug="affiliate" />;
}
