import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Stablecoin basics · Eteebaar",
  description: "Eteebaar spot exchange — Stablecoin basics.",
};

export default function Page() {
  return <StaticArticle slug="learnStable" backHref="/learn" backKey="pages.common.backLearn" />;
}
