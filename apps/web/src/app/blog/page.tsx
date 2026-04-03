import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Blog · Etebaar",
  description: "Etebaar spot exchange — Blog.",
};

export default function Page() {
  return <StaticArticle slug="blog" />;
}
