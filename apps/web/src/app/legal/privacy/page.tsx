import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Privacy · Eteebaar",
  description: "Eteebaar spot exchange — Privacy.",
};

export default function Page() {
  return <StaticArticle slug="legalPrivacy" backHref="/legal" backKey="pages.common.backLegal"/>;
}
