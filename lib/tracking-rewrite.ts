/**
 * Serve-time rewrite of Keitaro tracking URLs in landing-page HTML.
 *
 * Partner-supplied landing pages ship with their click URLs hardcoded to
 * go.gdkn.org. This points them at the brand's own tracking domain and tags
 * campaign clicks with the brand's traffic source — at serve time, so the stored
 * files in Storage are never modified.
 *
 * Config comes from this brand's site_settings (tracking_domain / tracking_source)
 * and is read null-safely by the caller. With no usable domain this returns the
 * input string unchanged, so an unconfigured brand serves byte-identical HTML.
 *
 * Runs LAST in the /lp/[slug] injector chain: the Keitaro visit script is injected
 * after the chrome swap, and its R_PATH / P_PATH / k.min.js src / <noscript> pixel
 * must be rewritten too. One pass covers the stored anchors and the injected
 * script alike — there is no separate templating of the stored script.
 */

export type TrackingConfig = {
  domain: string | null;
  source: string | null;
};

/**
 * Every `https://go.gdkn.org/...` literal. The excluded characters are the ones
 * that terminate a URL in the contexts it appears in: HTML attribute quotes,
 * JS string quotes and backticks, tag delimiters, and whitespace.
 *
 * The lookahead pins the right edge of the host, so a merely prefixed host —
 * `https://go.gdkn.org.example.com/x` — is left alone instead of having its
 * first three labels swapped out.
 */
const TRACKING_URL = /https:\/\/go\.gdkn\.org(?![A-Za-z0-9.-])(\/[^\s"'`<>()\\]*)?/gi;

/**
 * A Keitaro campaign alias — exactly one path segment (/ZttBSV, /lld13531).
 * Only these get the source tag. Infrastructure paths have two or more segments
 * (/js/k.min.js, /e752675/postback), so the tracker's own script and postback
 * endpoint are host-swapped but never given a stray query param — and neither is
 * any infrastructure path Keitaro adds later.
 */
const ALIAS_PATH = /^\/[A-Za-z0-9_-]+$/;

// Both config values are concatenated verbatim into a URL, so both are
// shape-checked here as well as on save. A value that fails is treated as absent
// rather than emitted, whatever path wrote it (admin form, SQL, General settings).
const VALID_HOST = /^[A-Za-z0-9.-]+$/;
const VALID_SOURCE = /^[A-Za-z0-9_-]+$/;

/**
 * "https://go.gdkn.org/" and "go.gdkn.org" both normalize to "go.gdkn.org".
 * Returns null for absent, blank, or malformed values.
 */
function normalizeHost(raw: string | null): string | null {
  const host = (raw ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  return VALID_HOST.test(host) ? host : null;
}

export function rewriteTrackingUrls(html: string, cfg: TrackingConfig): string {
  const host = normalizeHost(cfg.domain);
  if (!host) return html;

  const raw = (cfg.source ?? "").trim();
  const tag = VALID_SOURCE.test(raw) ? raw : "";

  return html.replace(TRACKING_URL, (_match, tail: string | undefined) => {
    const rest = tail ?? "";
    const split = rest.indexOf("?");
    const path = split === -1 ? rest : rest.slice(0, split);
    const query = split === -1 ? "" : rest.slice(split);

    // Host swap always applies; the query is carried over verbatim rather than
    // re-serialized so partner params survive byte-for-byte.
    const url = `https://${host}${path}${query}`;

    if (!tag) return url;
    if (!ALIAS_PATH.test(path)) return url;
    // Already tagged — makes a second pass a no-op, which matters when the target
    // domain IS go.gdkn.org (GuideKin) and the URLs still match on re-entry.
    if (/[?&](amp;)?source=/i.test(query)) return url;

    // Match the surrounding escaping: a query already written with &amp; in an
    // HTML attribute keeps &amp;, so one URL never mixes raw and escaped
    // separators.
    const sep = !query ? "?" : query.includes("&amp;") ? "&amp;" : "&";
    return `${url}${sep}source=${tag}`;
  });
}
