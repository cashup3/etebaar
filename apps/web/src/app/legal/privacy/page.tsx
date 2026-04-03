import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Privacy · Etebaar",
  description: "Etebaar spot exchange — Privacy.",
};

export default function Page() {
  return <StaticArticle slug="legalPrivacy" backHref="/legal" backKey="pages.common.backLegal"/>;
}
