import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Fee schedule · Eteebaar",
  description: "Eteebaar spot exchange — Fee schedule.",
};

export default function Page() {
  return <StaticArticle slug="fees" />;
}
