import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Cookie preferences · Etebaar",
  description: "Etebaar spot exchange — Cookie preferences.",
};

export default function Page() {
  return <StaticArticle slug="cookies" />;
}
