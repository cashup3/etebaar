import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Proof of reserves · Eteebaar",
  description: "Eteebaar spot exchange — Proof of reserves.",
};

export default function Page() {
  return <StaticArticle slug="por" />;
}
