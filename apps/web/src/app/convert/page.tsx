import type { Metadata } from "next";
import { ConvertClient } from "@/components/convert/ConvertClient";

export const metadata: Metadata = {
  title: "Convert · Eteebaar",
  description: "Reference calculator: Iranian toman, USD, GBP, GEL, AED, EUR, and major cryptocurrencies.",
};

export default function ConvertPage() {
  return <ConvertClient />;
}
