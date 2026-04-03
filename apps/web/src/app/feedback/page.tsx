import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Product feedback · Etebaar",
  description: "Etebaar spot exchange — Product feedback.",
};

export default function Page() {
  return <StaticArticle slug="feedback" />;
}
