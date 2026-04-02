import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(__dirname, "..", "src", "app");

function write(rel, body) {
  const d = path.join(app, rel);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, "page.tsx"), body);
}

function tpl(title, slug, extra = "") {
  return `import type { Metadata } from "next";
import { StaticArticle } from "@/components/static/StaticArticle";

export const metadata: Metadata = {
  title: "${title} · Eteebaar",
  description: "Eteebaar spot exchange — ${title}.",
};

export default function Page() {
  return <StaticArticle slug="${slug}" ${extra}/>;
}
`;
}

const simple = [
  ["announcements", "Announcements", "announcements"],
  ["blog", "Blog", "blog"],
  ["legal", "Legal overview", "legal"],
  ["downloads", "Downloads", "downloads"],
  ["buy", "Buy crypto", "buy"],
  ["earn", "Earn", "earn"],
  ["institutional", "Institutional", "institutional"],
  ["business/listing", "Listing inquiry", "bizListing"],
  ["business/market-maker", "Market maker program", "bizMm"],
  ["business/otc", "OTC desk", "bizOtc"],
  ["business/broker", "Broker tools", "bizBroker"],
  ["business/partners", "Partnerships", "bizPartners"],
  ["learn", "Learn hub", "learn"],
  ["learn/stablecoins", "Stablecoin basics", "learnStable"],
  ["learn/security", "Security guide", "learnSecurity"],
  ["affiliate", "Affiliate program", "affiliate"],
  ["referral", "Referral", "referral"],
  ["fees", "Fee schedule", "fees"],
  ["historical-data", "Historical data", "historicalData"],
  ["proof-of-reserves", "Proof of reserves", "por"],
  ["help", "Help center", "help"],
  ["docs/api", "API trading", "apiDocs"],
  ["docs/websocket", "WebSocket feeds", "websocket"],
  ["status", "System status", "status"],
  ["feedback", "Product feedback", "feedback"],
  ["law-enforcement", "Law enforcement", "lawEnforcement"],
  ["cookies", "Cookie preferences", "cookies"],
];

for (const [rel, title, slug] of simple) {
  write(rel, tpl(title, slug));
}

const legalSub = [
  ["legal/terms", "Terms of use", "legalTerms"],
  ["legal/privacy", "Privacy", "legalPrivacy"],
  ["legal/risk", "Risk disclosure", "legalRisk"],
];
for (const [rel, title, slug] of legalSub) {
  write(rel, tpl(title, slug, `backHref="/legal" backKey="pages.common.backLegal"`));
}

write(
  "community",
  `import type { Metadata } from "next";
import { CommunityPage } from "@/components/community/CommunityPage";

export const metadata: Metadata = {
  title: "Community · Eteebaar",
  description: "Official community channels and social links.",
};

export default function Page() {
  return <CommunityPage />;
}
`,
);

console.log("Static routes written under src/app");
