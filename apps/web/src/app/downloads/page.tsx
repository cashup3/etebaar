import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Downloads · Eteebaar",
  description: "Eteebaar spot exchange — Downloads.",
};

export default function Page() {
  return <StaticArticle slug="downloads" />;
}
