import { MarketingBanner } from "@/components/landing/MarketingBanner";

export const dynamic = "force-dynamic";

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mx-auto max-w-[1920px] px-2 pb-4 pt-2 sm:px-3">{children}</div>
      <div className="mx-auto max-w-[1920px] px-2 pb-6 sm:px-3">
        <MarketingBanner variant="trade" />
      </div>
    </div>
  );
}
