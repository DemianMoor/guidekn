import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, getAnalyticsSettings } from "@/lib/supabase";
import {
  applyChromeSwap,
  effectiveChromeState,
} from "@/lib/landing-page-chrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_PUBLIC_BASE =
  "https://bdhujqomjvfgzbgicwev.supabase.co/storage/v1/object/public/landing-pages";

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
    .select(
      "slug, entry_file, is_active, use_site_chrome, chrome_revert_to, chrome_revert_at"
    )
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

  // Asset rewrite first so the partner's own `src=`/`href=` get pointed at
  // Supabase Storage. Chrome swap runs next — it injects site-root-relative
  // links (`/picks`, etc.) that we don't want the rewrite to touch. GTM last,
  // so its scripts can't be stripped by the chrome swap.
  html = rewriteAssetPaths(html, slug);

  const { effective: useSiteChrome } = effectiveChromeState(page);
  if (useSiteChrome) {
    html = applyChromeSwap(html).html;
  }

  // Analytics IDs come from site_settings (GuideKin landing_pages have no
  // per-page gtm_id column, so there's no page-level override to prefer);
  // getAnalyticsSettings falls back to the previous hardcoded values.
  const { gtmId, clarityId, keitaroScript } = await getAnalyticsSettings();

  if (gtmId) {
    html = injectGtm(html, gtmId);
  }

  html = injectClarity(html, clarityId);

  if (keitaroScript) {
    html = injectKeitaro(html, keitaroScript);
  }

  html = injectUtmForwarder(html);

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
 * Forwards the landing page's incoming query string (utm_*, sub_id*, fbclid,
 * gclid, anything else marketing puts on the ad URL) to every anchor on the
 * page. Anchor's own params win on conflict so the merchant's existing
 * tracking is preserved. Runs once on DOMContentLoaded and watches for any
 * anchors added later by a framework or analytics tag.
 */
function injectUtmForwarder(html: string): string {
  const script = `<script>(function(){try{var src=new URLSearchParams(window.location.search);if(!src.toString())return;function decorate(a){var h=a.getAttribute('href');if(!h)return;if(/^(mailto:|tel:|javascript:|data:|#)/i.test(h))return;var u;try{u=new URL(h,window.location.href);}catch(e){return;}if(u.protocol!=='http:'&&u.protocol!=='https:')return;src.forEach(function(v,k){if(!u.searchParams.has(k))u.searchParams.set(k,v);});a.setAttribute('href',u.toString());}function all(r){var n=(r||document).querySelectorAll('a[href]');for(var i=0;i<n.length;i++)decorate(n[i]);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){all();});}else{all();}new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var ad=ms[i].addedNodes;for(var j=0;j<ad.length;j++){var nd=ad[j];if(nd.nodeType!==1)continue;if(nd.tagName==='A')decorate(nd);else if(nd.querySelectorAll)all(nd);}}}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}})();</script>`;

  const bodyClose = html.search(/<\/body\s*>/i);
  if (bodyClose !== -1) {
    return html.substring(0, bodyClose) + script + html.substring(bodyClose);
  }
  return html + script;
}

/**
 * Loads Microsoft Clarity directly on every LP rather than relying on the
 * GTM-side Clarity tag. The GTM Clarity tag's trigger is easy to misconfigure
 * (e.g. "Some Pages" with a URL filter that excludes /lp/*), at which point
 * Clarity silently stops recording on LPs. The window.clarity guard makes
 * this snippet a no-op if the GTM-side tag already fired first.
 */
function injectClarity(html: string, clarityId: string): string {
  const script = `<script>(function(c,l,a,r,i,t,y){if(c[a])return;c[a]=function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");</script>`;

  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertAt = headMatch.index! + headMatch[0].length;
    return html.substring(0, insertAt) + script + html.substring(insertAt);
  }
  return html;
}

/**
 * Direct-mode Keitaro capture for landing pages. Mirrors the GTM injection, but
 * gated: the brand's stored Keitaro script runs ONLY on SMS-direct visits (when
 * `sub_id_5` is present). The stored HTML is parked in an inert <template> (its
 * <script> does not execute on parse), and a small gate script — only when the
 * gate passes — recreates each <script> as a live DOM node so it executes. This
 * handles both inline scripts and <script src> tags, and loads nothing for
 * organic visits. Wrapped in try/catch so a malformed value never breaks the
 * page. GTM is untouched and keeps firing on every pageview.
 *
 * It also adds the page slug to the click as sub_id_4 (a click-only reporting
 * dimension) via KTracking.update — keyed off the click token, so it never
 * touches the URL and never round-trips to the affiliate (unlike sub_id_3/
 * sub_id_5, which the query-forwarder sends downstream). The ready() callback is
 * queued before the async k.min.js initialises, so it fires once the token exists.
 */
function injectKeitaro(html: string, keitaroScript: string): string {
  const block =
    `<template id="keitaro-direct">${keitaroScript}</template>` +
    `<script>(function(){try{if(!new URLSearchParams(window.location.search).has('sub_id_5'))return;var t=document.getElementById('keitaro-direct');if(!t)return;var ss=t.content.querySelectorAll('script');for(var i=0;i<ss.length;i++){var o=ss[i],n=document.createElement('script');for(var j=0;j<o.attributes.length;j++){n.setAttribute(o.attributes[j].name,o.attributes[j].value);}if(o.src){n.src=o.src;}else{n.textContent=o.textContent;}document.head.appendChild(n);}var p=window.location.pathname,slug;if(p.indexOf('/lp/')===0){slug=p.slice(4).split('/')[0];}else{var sg=p.split('/').filter(Boolean);slug=sg[sg.length-1]||'';}if(slug&&window.KTracking&&window.KTracking.ready){window.KTracking.ready(function(){try{window.KTracking.update({sub_id_4:slug});}catch(e){}});}}catch(e){}})();</script>`;

  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertAt = headMatch.index! + headMatch[0].length;
    return html.substring(0, insertAt) + block + html.substring(insertAt);
  }
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
