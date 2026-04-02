import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Help center · Eteebaar",
  description: "Eteebaar spot exchange — Help center.",
};

export default function Page() {
  return <StaticArticle slug="help" />;
}
