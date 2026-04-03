import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Stablecoin basics · Etebaar",
  description: "Etebaar spot exchange — Stablecoin basics.",
};

export default function Page() {
  return <StaticArticle slug="learnStable" backHref="/learn" backKey="pages.common.backLearn" />;
}
