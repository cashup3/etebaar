import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Product feedback · Eteebaar",
  description: "Eteebaar spot exchange — Product feedback.",
};

export default function Page() {
  return <StaticArticle slug="feedback" />;
}
