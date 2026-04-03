import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Institutional · Etebaar",
  description: "Etebaar spot exchange — Institutional.",
};

export default function Page() {
  return <StaticArticle slug="institutional" />;
}
