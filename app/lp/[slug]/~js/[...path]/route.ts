import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSettings } from "@/lib/supabase";
import {
  isPassthroughPath,
  pickSubIds,
  rewriteTrackingUrls,
} from "@/lib/subid-guarantee/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A landing page's own .js file, served with the same tracker rewrite as its
 * HTML so tracker URLs that live in a script file (ORDER_URL, CONFIG.OFFER_URL)
 * point at this brand's tracker and carry the visitor's sub_id*
 * (lib/subid-guarantee/core.ts). /lp/[slug] routes its <script src> here.
 *
 * Never the url( asset rewrite: in JS that turns `new URL(` into a Storage
 * path. The bucket is public, so this serves nothing that is not already public.
 */
const STORAGE_PUBLIC_BASE =
  "https://bdhujqomjvfgzbgicwev.supabase.co/storage/v1/object/public/landing-pages";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string; path: string[] }> },
) {
  const { slug, path } = await context.params;

  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug) || !isPassthroughPath(path)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let js: string;
  try {
    const res = await fetch(
      `${STORAGE_PUBLIC_BASE}/${slug}/${path.map(encodeURIComponent).join("/")}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return new NextResponse("Not Found", { status: 404 });
    }
    js = await res.text();
  } catch {
    return new NextResponse("Failed to load script", { status: 502 });
  }

  const { trackingDomain, trackingSource } = await getAnalyticsSettings();
  js = rewriteTrackingUrls(js, {
    domain: trackingDomain,
    source: trackingSource,
    subIds: pickSubIds(req.nextUrl.searchParams),
  });

  return new NextResponse(js, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      // Same as the page: the edge keys on the full URL, so a visitor's sub_id*
      // only reach their own script URL.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
