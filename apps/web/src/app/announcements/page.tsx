import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Announcements · Etebaar",
  description: "Etebaar spot exchange — Announcements.",
};

export default function Page() {
  return <StaticArticle slug="announcements" />;
}
