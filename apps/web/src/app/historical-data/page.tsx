import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Historical data · Eteebaar",
  description: "Eteebaar spot exchange — Historical data.",
};

export default function Page() {
  return <StaticArticle slug="historicalData" />;
}
