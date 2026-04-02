import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Legal overview · Eteebaar",
  description: "Eteebaar spot exchange — Legal overview.",
};

export default function Page() {
  return <StaticArticle slug="legal" />;
}
