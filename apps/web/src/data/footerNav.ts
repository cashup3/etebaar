export type FooterLinkKey = {
  labelKey: string;
  href: string;
  external?: boolean;
};

export const footerAbout: FooterLinkKey[] = [
  { labelKey: "footer.aboutHome", href: "/" },
  { labelKey: "footer.aboutMarkets", href: "/markets" },
  { labelKey: "footer.aboutSpot", href: "/trade" },
  { labelKey: "footer.aboutSignup", href: "/login?signup=1" },
  { labelKey: "footer.aboutLogin", href: "/login" },
  { labelKey: "footer.aboutAnnounce", href: "/announcements" },
  { labelKey: "footer.aboutBlog", href: "/blog" },
  { labelKey: "footer.aboutLegal", href: "/legal" },
  { labelKey: "footer.aboutTerms", href: "/legal/terms" },
  { labelKey: "footer.aboutPrivacy", href: "/legal/privacy" },
  { labelKey: "footer.aboutRisk", href: "/legal/risk" },
  { labelKey: "footer.aboutDownloads", href: "/downloads" },
];

export const footerProducts: FooterLinkKey[] = [
  { labelKey: "footer.prodSpot", href: "/trade" },
  { labelKey: "footer.prodBuy", href: "/buy" },
  { labelKey: "footer.prodConvert", href: "/convert" },
  { labelKey: "footer.prodEarn", href: "/earn" },
  { labelKey: "footer.prodApi", href: "/docs/api" },
  { labelKey: "footer.prodWs", href: "/docs/websocket" },
  { labelKey: "footer.prodInst", href: "/institutional" },
];

export const footerBusiness: FooterLinkKey[] = [
  { labelKey: "footer.bizList", href: "/business/listing" },
  { labelKey: "footer.bizMm", href: "/business/market-maker" },
  { labelKey: "footer.bizOtc", href: "/business/otc" },
  { labelKey: "footer.bizBroker", href: "/business/broker" },
  { labelKey: "footer.bizPartner", href: "/business/partners" },
];

export const footerLearn: FooterLinkKey[] = [
  { labelKey: "footer.learnHub", href: "/learn" },
  { labelKey: "footer.learnPrices", href: "/markets" },
  { labelKey: "footer.learnBtc", href: "/trade?symbol=BTCUSDT" },
  { labelKey: "footer.learnEth", href: "/trade?symbol=ETHUSDT" },
  { labelKey: "footer.learnStable", href: "/learn/stablecoins" },
  { labelKey: "footer.learnSec", href: "/learn/security" },
];

export const footerService: FooterLinkKey[] = [
  { labelKey: "footer.svcAff", href: "/affiliate" },
  { labelKey: "footer.svcRef", href: "/referral" },
  { labelKey: "footer.svcFees", href: "/fees" },
  { labelKey: "footer.svcHist", href: "/historical-data" },
  { labelKey: "footer.svcPor", href: "/proof-of-reserves" },
];

export const footerSupport: FooterLinkKey[] = [
  { labelKey: "footer.supHelp", href: "/help" },
  { labelKey: "footer.supApi", href: "/docs/api" },
  { labelKey: "footer.supStatus", href: "/status" },
  { labelKey: "footer.supFeedback", href: "/feedback" },
  { labelKey: "footer.supLe", href: "/law-enforcement" },
];

export type SocialItem = {
  label: string;
  href: string;
  key: string;
};

export const footerSocial: SocialItem[] = [
  { label: "Discord", href: "/community#discord", key: "D" },
  { label: "Telegram", href: "/community#telegram", key: "T" },
  { label: "X", href: "/community#x", key: "X" },
  { label: "YouTube", href: "/community#youtube", key: "Y" },
  { label: "Reddit", href: "/community#reddit", key: "R" },
  { label: "GitHub", href: "/community#github", key: "G" },
];
