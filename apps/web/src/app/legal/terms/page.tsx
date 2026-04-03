import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Terms of use · Etebaar",
  description: "Etebaar spot exchange — Terms of use.",
};

export default function Page() {
  return <StaticArticle slug="legalTerms" backHref="/legal" backKey="pages.common.backLegal"/>;
}
