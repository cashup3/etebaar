import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Security guide · Etebaar",
  description: "Etebaar spot exchange — Security guide.",
};

export default function Page() {
  return <StaticArticle slug="learnSecurity" backHref="/learn" backKey="pages.common.backLearn" />;
}
