"use client";

import { useEffect } from "react";

/** Minimal shape of the Keitaro tracking API exposed by the brand's script. */
type KTracking = {
  ready?: (fn: () => void) => void;
  update?: (subIds: Record<string, string>) => void;
};

/**
 * Page slug for the `sub_id_4` reporting dimension:
 * - `/lp/<slug>` → the segment immediately after `/lp/`
 * - otherwise (articles, e.g. `/article/<slug>` or `/<pillar>/<slug>`) → the
 *   last non-empty path segment
 * Trailing slashes fall out naturally (split drops empty segments).
 */
function pageSlug(pathname: string): string {
  if (pathname.startsWith("/lp/")) return pathname.slice(4).split("/")[0] || "";
  const segs = pathname.split("/").filter(Boolean);
  return segs[segs.length - 1] || "";
}

/**
 * Direct-mode Keitaro capture. Mirrors the GTM injection path (driven by
 * site_settings), but fires ONLY on SMS-direct visits — when `sub_id_5` is in
 * the URL. Organic / non-SMS visits do nothing (they stay on GA4 via GTM), and
 * GTM itself is untouched.
 *
 * The stored value is an HTML `<script>…</script>` block. Setting it via
 * innerHTML does NOT execute scripts, so each `<script>` is recreated as a live
 * DOM node (copying attributes / src / inline text) so the browser runs it.
 * Everything is wrapped in try/catch so a malformed value can never break the
 * page.
 */
export function Keitaro({ script }: { script: string }) {
  useEffect(() => {
    try {
      if (!script) return;
      if (window.location.pathname.startsWith("/admin")) return; // mirror Analytics
      const params = new URLSearchParams(window.location.search);
      if (!params.has("sub_id_5")) return; // organic / non-SMS visit — do nothing

      const tpl = document.createElement("template");
      tpl.innerHTML = script; // inert: template scripts do not execute on parse
      tpl.content.querySelectorAll("script").forEach((old) => {
        const el = document.createElement("script");
        Array.from(old.attributes).forEach(({ name, value }) =>
          el.setAttribute(name, value),
        );
        if (old.src) el.src = old.src;
        else el.textContent = old.textContent;
        document.head.appendChild(el);
      });

      // Add the visited page's slug to the Keitaro click as sub_id_4 (a
      // click-only reporting dimension). Registered now, before the async
      // k.min.js initialises, so the queued ready() callback fires once the
      // click token exists. update() keys off that token — it does NOT touch the
      // URL, so sub_id_4 never round-trips to the affiliate (unlike
      // sub_id_3/sub_id_5, which the LP query-forwarder sends downstream).
      const slug = pageSlug(window.location.pathname);
      const kt = (window as unknown as { KTracking?: KTracking }).KTracking;
      if (slug && kt?.ready) {
        kt.ready(() => {
          try {
            kt.update?.({ sub_id_4: slug });
          } catch {
            /* fail-safe */
          }
        });
      }
    } catch {
      /* fail-safe: never break the page */
    }
  }, [script]);

  return null;
}
