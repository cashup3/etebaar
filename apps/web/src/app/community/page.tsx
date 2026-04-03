import type { Metadata } from "next";
import { CommunityPage } from "@/components/community/CommunityPage";

export const metadata: Metadata = {
  title: "Community · Etebaar",
  description: "Official community channels and social links.",
};

export default function Page() {
  return <CommunityPage />;
}
