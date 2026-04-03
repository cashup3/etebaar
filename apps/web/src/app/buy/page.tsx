import type { Metadata } from "next";
import { BuyCryptoPage } from "@/components/buy/BuyCryptoPage";

export const metadata: Metadata = {
  title: "Buy crypto · Etebaar",
  description:
    "Buy Bitcoin, Ethereum, and major crypto on Etebaar spot markets. Reference toman prices, web terminal, sign up in minutes. Based in Tbilisi, Georgia.",
};

export default function Page() {
  return <BuyCryptoPage />;
}
