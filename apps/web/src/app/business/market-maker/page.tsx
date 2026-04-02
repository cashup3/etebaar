import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Market maker program · Eteebaar",
  description: "Eteebaar spot exchange — Market maker program.",
};

export default function Page() {
  return <StaticArticle slug="bizMm" />;
}
