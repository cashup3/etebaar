import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Institutional · Eteebaar",
  description: "Eteebaar spot exchange — Institutional.",
};

export default function Page() {
  return <StaticArticle slug="institutional" />;
}
