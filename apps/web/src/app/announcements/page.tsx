import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Announcements · Eteebaar",
  description: "Eteebaar spot exchange — Announcements.",
};

export default function Page() {
  return <StaticArticle slug="announcements" />;
}
