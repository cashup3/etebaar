import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Referral · Eteebaar",
  description: "Eteebaar spot exchange — Referral.",
};

export default function Page() {
  return <StaticArticle slug="referral" />;
}
