import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Learn hub · Eteebaar",
  description: "Eteebaar spot exchange — Learn hub.",
};

export default function Page() {
  return <StaticArticle slug="learn" />;
}
