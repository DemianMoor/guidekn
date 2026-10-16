/**
 * Serve-time rewrite of Keitaro tracking URLs in landing-page HTML.
 *
 * Landing pages are shared between brands, so a page can arrive carrying any
 * sister brand's tracker host (or this brand's own). This points every URL on a
 * known tracker host at this brand's tracking domain and tags campaign clicks with
 * this brand's traffic source — at serve time, so the stored files in Storage are
 * never modified. URLs inside inline scripts are covered as well as attributes.
 *
 * Config comes from this brand's site_settings (tracking_domain / tracking_source)
 * and is read null-safely by the caller. With no usable domain this returns the
 * input string unchanged, so an unconfigured brand serves byte-identical HTML.
 *
 * Runs LAST in the /lp/[slug] injector chain. The injected Keitaro visit script
 * (<template id="keitaro-direct">) is skipped: the stored script already carries
 * this brand's own tracker host and is served exactly as stored.
 */

export type TrackingConfig = {
  domain: string | null;
  source: string | null;
};

/**
 * Every brand's Keitaro tracker domain. A new brand's tracker domain must be
 * added here (in every brand repo), or pages shared from that brand keep sending
 * clicks to its tracker. Exact hosts only: admin.gdkn.org and lookalikes such as
 * go.gdkn.org.example.com never match.
 */
const SISTER_TRACKER_HOSTS = ["go.gdkn.org", "go.lumzen.co", "go.fitsyou.net", "sms.blogcascade.com"];

/**
 * Every absolute URL literal. The excluded characters are the ones that
 * terminate a URL in the contexts it appears in: HTML attribute quotes, JS
 * string quotes and backticks, tag delimiters, and whitespace. The captured host
 * is then compared exactly against the known list.
 */
const ANY_URL = /https?:\/\/([A-Za-z0-9.-]+)(\/[^\s"'`<>()\\]*)?/gi;

/** The injected visit script, left out of the rewrite. */
const VISIT_SCRIPT = /<template id="keitaro-direct">[\s\S]*?<\/template>/i;

/**
 * A Keitaro campaign alias — exactly one path segment (/ZttBSV, /lld13531).
 * Only these get the source tag. Infrastructure paths have two or more segments
 * (/js/k.min.js, /e752675/postback), so they are host-swapped but never given a
 * stray query param.
 */
const ALIAS_PATH = /^\/[A-Za-z0-9_-]+$/;

// Both config values are concatenated verbatim into a URL, so both are
// shape-checked here as well as on save. A value that fails is treated as absent
// rather than emitted, whatever path wrote it (admin form, SQL, General settings).
const VALID_HOST = /^[A-Za-z0-9.-]+$/;
const VALID_SOURCE = /^[A-Za-z0-9_-]+$/;

/**
 * "https://go.gdkn.org/" and "go.gdkn.org" both normalize to "go.gdkn.org".
 * Returns null for absent, blank, or malformed values. Exported so callers can
 * gate on the same answer the rewriter itself will reach.
 */
export function resolveTrackingHost(raw: string | null): string | null {
  const host = (raw ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  return VALID_HOST.test(host) ? host : null;
}

export function rewriteTrackingUrls(html: string, cfg: TrackingConfig): string {
  const host = resolveTrackingHost(cfg.domain);
  if (!host) return html;
  const raw = (cfg.source ?? "").trim();
  const tag = VALID_SOURCE.test(raw) ? raw : "";
  const known = new Set([...SISTER_TRACKER_HOSTS, host.toLowerCase()]);

  const rewrite = (part: string) =>
    part.replace(ANY_URL, (match, urlHost: string, tail: string | undefined) => {
      if (!known.has(urlHost.toLowerCase())) return match;
      const rest = tail ?? "";
      const split = rest.indexOf("?");
      const path = split === -1 ? rest : rest.slice(0, split);
      const query = split === -1 ? "" : rest.slice(split);
      // Host swap always applies; the query is carried over verbatim rather than
      // re-serialized so partner params survive byte-for-byte.
      const url = `https://${host}${path}${query}`;
      if (!tag || !ALIAS_PATH.test(path)) return url;
      // Already tagged — makes a second pass a no-op.
      if (/[?&](amp;)?source=/i.test(query)) return url;
      // Match the surrounding escaping: a query already written with &amp; in an
      // HTML attribute keeps &amp;, so one URL never mixes raw and escaped
      // separators.
      const sep = !query ? "?" : query.includes("&amp;") ? "&amp;" : "&";
      return `${url}${sep}source=${tag}`;
    });

  const visit = html.match(VISIT_SCRIPT);
  if (!visit) return rewrite(html);
  const at = visit.index!;
  return rewrite(html.slice(0, at)) + visit[0] + rewrite(html.slice(at + visit[0].length));
}
