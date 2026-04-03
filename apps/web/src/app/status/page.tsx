import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "System status · Etebaar",
  description: "Etebaar spot exchange — System status.",
};

export default function Page() {
  return <StaticArticle slug="status" />;
}
