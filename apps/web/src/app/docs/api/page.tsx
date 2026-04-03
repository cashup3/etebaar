import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "API trading · Etebaar",
  description: "Etebaar spot exchange — API trading.",
};

export default function Page() {
  return <StaticArticle slug="apiDocs" />;
}
