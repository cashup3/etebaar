import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Learn hub · Etebaar",
  description: "Etebaar spot exchange — Learn hub.",
};

export default function Page() {
  return <StaticArticle slug="learn" />;
}
