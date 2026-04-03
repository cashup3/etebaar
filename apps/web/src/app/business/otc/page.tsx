import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "OTC desk · Etebaar",
  description: "Etebaar spot exchange — OTC desk.",
};

export default function Page() {
  return <StaticArticle slug="bizOtc" />;
}
