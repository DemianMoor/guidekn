"use client";

import { useEffect } from "react";

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
    } catch {
      /* fail-safe: never break the page */
    }
  }, [script]);

  return null;
}
