import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Risk disclosure · Etebaar",
  description: "Etebaar spot exchange — Risk disclosure.",
};

export default function Page() {
  return <StaticArticle slug="legalRisk" backHref="/legal" backKey="pages.common.backLegal"/>;
}
