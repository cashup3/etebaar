import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Buy crypto · Eteebaar",
  description: "Eteebaar spot exchange — Buy crypto.",
};

export default function Page() {
  return <StaticArticle slug="buy" />;
}
