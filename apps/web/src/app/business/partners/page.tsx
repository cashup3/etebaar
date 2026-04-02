import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Partnerships · Eteebaar",
  description: "Eteebaar spot exchange — Partnerships.",
};

export default function Page() {
  return <StaticArticle slug="bizPartners" />;
}
