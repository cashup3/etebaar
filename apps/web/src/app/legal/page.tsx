import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Legal overview · Etebaar",
  description: "Etebaar spot exchange — Legal overview.",
};

export default function Page() {
  return <StaticArticle slug="legal" />;
}
