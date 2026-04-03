import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Fee schedule · Etebaar",
  description: "Etebaar spot exchange — Fee schedule.",
};

export default function Page() {
  return <StaticArticle slug="fees" />;
}
