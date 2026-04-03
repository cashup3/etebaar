import { NextResponse } from "next/server";

const SVG_VERSION = "0.18.1";

/**
 * Proxies crypto icons through our origin so logos load when CDNs are blocked client-side
 * (common on some networks). Tries SVG (cryptocurrency-icons) then PNG (CoinCap).
 */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await context.params;
  const slug = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!slug || slug.length > 40) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const svgBases = [
    `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@${SVG_VERSION}/svg/color/${slug}.svg`,
    `https://unpkg.com/cryptocurrency-icons@${SVG_VERSION}/svg/color/${slug}.svg`,
  ];

  for (const url of svgBases) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "image/svg+xml,*/*" },
        next: { revalidate: 86_400 },
      });
      if (!res.ok) continue;
      const body = await res.text();
      if (!body.includes("<svg")) continue;
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch {
      /* try next */
    }
  }

  try {
    const pngUrl = `https://assets.coincap.io/assets/icons/${slug}@2x.png`;
    const png = await fetch(pngUrl, { next: { revalidate: 86_400 } });
    if (png.ok) {
      const buf = await png.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }
  } catch {
    /* fall through */
  }

  return new NextResponse(null, { status: 404 });
}
