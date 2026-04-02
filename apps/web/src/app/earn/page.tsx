import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Earn · Eteebaar",
  description: "Eteebaar spot exchange — Earn.",
};

export default function Page() {
  return <StaticArticle slug="earn" />;
}
