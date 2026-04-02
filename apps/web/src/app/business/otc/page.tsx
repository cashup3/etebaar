import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "OTC desk · Eteebaar",
  description: "Eteebaar spot exchange — OTC desk.",
};

export default function Page() {
  return <StaticArticle slug="bizOtc" />;
}
