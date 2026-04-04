import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { ConvertClient } from "@/components/convert/ConvertClient";

const convertDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Convert · Etebaar",
  description: "Reference calculator: Iranian toman, USD, GBP, GEL, AED, EUR, and major cryptocurrencies.",
};

export default function ConvertPage() {
  return <ConvertClient displayFontClass={convertDisplay.className} />;
}
