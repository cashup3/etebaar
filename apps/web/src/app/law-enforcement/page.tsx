import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "Law enforcement · Eteebaar",
  description: "Eteebaar spot exchange — Law enforcement.",
};

export default function Page() {
  return <StaticArticle slug="lawEnforcement" />;
}
