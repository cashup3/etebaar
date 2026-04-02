import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Listing inquiry · Eteebaar",
  description: "Eteebaar spot exchange — Listing inquiry.",
};

export default function Page() {
  return <StaticArticle slug="bizListing" />;
}
