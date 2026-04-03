import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Market maker program · Etebaar",
  description: "Etebaar spot exchange — Market maker program.",
};

export default function Page() {
  return <StaticArticle slug="bizMm" />;
}
