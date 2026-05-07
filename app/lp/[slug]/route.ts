import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_PUBLIC_BASE =
  "https://bdhujqomjvfgzbgicwev.supabase.co/storage/v1/object/public/landing-pages";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const supabase = createSupabaseAdmin();
  const { data: page } = await supabase
    .from("landing_pages")
    .select("slug, entry_file, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!page) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const entryUrl = `${STORAGE_PUBLIC_BASE}/${slug}/${page.entry_file}`;
  let html: string;
  try {
    const res = await fetch(entryUrl, { cache: "no-store" });
    if (!res.ok) {
      return new NextResponse("Landing page bundle missing", { status: 502 });
    }
    html = await res.text();
  } catch {
    return new NextResponse("Failed to load landing page", { status: 502 });
  }

  html = rewriteAssetPaths(html, slug);

  if (GTM_ID) {
    html = injectGtm(html, GTM_ID);
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Rewrites relative asset paths (href, src, srcset, url() in inline styles)
 * to absolute Supabase Storage URLs.
 */
function rewriteAssetPaths(html: string, slug: string): string {
  const baseUrl = `${STORAGE_PUBLIC_BASE}/${slug}/`;

  function isRelative(url: string): boolean {
    if (!url) return false;
    if (/^https?:\/\//i.test(url)) return false;
    if (url.startsWith("//")) return false;
    if (url.startsWith("#")) return false;
    if (url.startsWith("mailto:")) return false;
    if (url.startsWith("tel:")) return false;
    if (url.startsWith("data:")) return false;
    if (url.startsWith("javascript:")) return false;
    return true;
  }

  function resolveUrl(url: string): string {
    if (!isRelative(url)) return url;
    const cleaned = url.replace(/^\.\//, "").replace(/^\//, "");
    return baseUrl + cleaned;
  }

  html = html.replace(
    /\b(href|src)=(["'])([^"']+)(["'])/gi,
    (_match, attr, q1, url, q2) => `${attr}=${q1}${resolveUrl(url)}${q2}`
  );

  html = html.replace(
    /\bsrcset=(["'])([^"']+)(["'])/gi,
    (_match, q1, value, q2) => {
      const rewritten = value
        .split(",")
        .map((part: string) => {
          const trimmed = part.trim();
          const spaceIdx = trimmed.search(/\s/);
          if (spaceIdx === -1) {
            return resolveUrl(trimmed);
          }
          const url = trimmed.substring(0, spaceIdx);
          const descriptor = trimmed.substring(spaceIdx);
          return resolveUrl(url) + descriptor;
        })
        .join(", ");
      return `srcset=${q1}${rewritten}${q2}`;
    }
  );

  html = html.replace(
    /url\((["']?)([^)"']+)(["']?)\)/gi,
    (_match, q1, url, q2) => `url(${q1}${resolveUrl(url)}${q2})`
  );

  return html;
}

/**
 * Injects GTM head script after <head> and noscript iframe after <body>.
 * If either tag is missing, that injection is skipped rather than guessed.
 */
function injectGtm(html: string, gtmId: string): string {
  const headScript = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`;

  const bodyNoscript = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertAt = headMatch.index! + headMatch[0].length;
    html =
      html.substring(0, insertAt) + headScript + html.substring(insertAt);
  }

  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const insertAt = bodyMatch.index! + bodyMatch[0].length;
    html =
      html.substring(0, insertAt) + bodyNoscript + html.substring(insertAt);
  }

  return html;
}
