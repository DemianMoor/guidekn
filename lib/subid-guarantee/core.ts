// Site-wide sub_id guarantee for uploaded landing pages (ClickUp 1amdve27npp).
//
// IDENTICAL IN EVERY BRAND REPO (gdkn_code, lz_code, fy_code, casc_code): copy the whole lib/subid-guarantee/ folder,
// never edit one copy alone. Pure string work with no imports, so core.test.mjs runs it under plain `node --test`.
//
// Keitaro attribution (sub_id1, sub_id3, source) must not depend on a page's own JavaScript: a page that builds its
// CTA through a param whitelist silently drops sub_id*, and page-level fixes get overwritten by re-uploads. So:
//   1. rewriteTrackingUrls — every URL on a known tracker host is pointed at this brand's tracker. Campaign aliases
//      (one path segment) also get ?source=<tracking_source> and every sub_id* from the LP request they lack. The
//      Keitaro visit-script template and multi-segment paths (/js/k.min.js, /<id>/postback) are host-swapped only.
//   2. routeScriptsThroughPassthrough — the page's own .js files are served via <lp path><slug>/~js/<file> so the same
//      rewrite reaches tracker URLs that live outside the HTML (hmm/hrm ORDER_URL, asg/tca CONFIG.OFFER_URL).
//   3. backstopScript — a client script for URLs a page builds at runtime from scratch: it fills missing sub_id* on
//      navigations to the known tracker hosts and touches nothing else.
//
// Request values end up inside HTML and inline JS, so keys are whitelisted and values strictly percent-encoded.
// A request without sub_id* gets no injection. Pages are edge-cached per full URL (query included), so injected
// values only ever reach responses for the URL that carried them.

// Every brand's Keitaro tracker. A new brand's tracker host must be added here (and the folder copied to every repo),
// or pages copied from that brand keep sending clicks to its tracker. Exact hosts only: lookalikes never match.
export const TRACKER_HOSTS = ['go.gdkn.org', 'go.lumzen.co', 'go.fitsyou.net', 'sms.blogcascade.com']

export type SubIds = [string, string][]
export type TrackingConfig = { domain: string | null; source: string | null; subIds?: SubIds }

const SUB_ID_KEY = /^sub_id[A-Za-z0-9_]{0,8}$/
const MAX_SUB_IDS = 30
const MAX_VALUE = 256

// Every absolute URL literal. Stops at the characters that end a URL in HTML attributes and JS strings; the host is
// then compared exactly, so `go.gdkn.org.example.com` is left alone.
const ANY_URL = /https?:\/\/([A-Za-z0-9.-]+)(\/[^\s"'`<>()\\]*)?/gi

// The injected visit script: host-swapped only, never given source or sub_id (its R_PATH looks like an alias).
const VISIT_SCRIPT = /<template id="keitaro-direct">[\s\S]*?<\/template>/i

// A Keitaro campaign alias is exactly one path segment (/ZttBSV, /sas42169).
const ALIAS_PATH = /^\/[A-Za-z0-9_-]+$/

// Both values are concatenated verbatim into URLs, so both are shape-checked here as well as on save.
const VALID_HOST = /^[A-Za-z0-9.-]+$/
const VALID_SOURCE = /^[A-Za-z0-9_-]+$/

// "https://sms.blogcascade.com/" and "sms.blogcascade.com" both normalize to "sms.blogcascade.com".
// Null for absent, blank or malformed values.
export function resolveTrackingHost(raw: string | null): string | null {
  const host = (raw ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  return VALID_HOST.test(host) ? host : null
}

// The sub_id* params of an LP request, in request order. First occurrence of a key wins; empty and oversized values
// are dropped, so nothing here can carry markup or grow a URL without bound.
export function pickSubIds(params: URLSearchParams): SubIds {
  const out: SubIds = []
  params.forEach((value, key) => {
    if (out.length >= MAX_SUB_IDS || !SUB_ID_KEY.test(key) || !value || value.length > MAX_VALUE) return
    if (!out.some(([k]) => k === key)) out.push([key, value])
  })
  return out
}

// Everything outside A-Za-z0-9-_.~ is percent-encoded, including ' ( ) ! * that encodeURIComponent leaves alone,
// so a value can never end a JS string or an attribute it is written into.
const encodeValue = (v: string) => encodeURIComponent(v).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())

export function rewriteTrackingUrls(text: string, cfg: TrackingConfig): string {
  const host = resolveTrackingHost(cfg.domain)
  if (!host) return text
  const raw = (cfg.source ?? '').trim()
  const tag = VALID_SOURCE.test(raw) ? raw : ''
  const subIds = (cfg.subIds ?? []).filter(([k]) => SUB_ID_KEY.test(k))
  const known = new Set([...TRACKER_HOSTS, host.toLowerCase()])

  const rewrite = (part: string, inject: boolean) => part.replace(ANY_URL, (match, urlHost: string, tail: string | undefined) => {
    if (!known.has(urlHost.toLowerCase())) return match
    let rest = tail ?? ''
    const hashAt = rest.indexOf('#')
    const hash = hashAt === -1 ? '' : rest.slice(hashAt)
    if (hashAt !== -1) rest = rest.slice(0, hashAt)
    const split = rest.indexOf('?')
    const path = split === -1 ? rest : rest.slice(0, split)
    let query = split === -1 ? '' : rest.slice(split)
    // Host swap always applies; the query is carried over verbatim so partner params survive byte-for-byte.
    if (!inject || !ALIAS_PATH.test(path)) return `https://${host}${path}${query}${hash}`

    const has = (key: string) => new RegExp(`[?&](?:amp;)?${key}=`, 'i').test(query)
    const adds: string[] = []
    if (tag && !has('source')) adds.push(`source=${tag}`)
    for (const [key, value] of subIds) if (!has(key)) adds.push(`${key}=${encodeValue(value)}`)
    if (!adds.length) return `https://${host}${path}${query}${hash}`

    // Match the surrounding escaping so one URL never mixes raw and &amp; separators.
    const amp = query.includes('&amp;') ? '&amp;' : '&'
    // A query ending in a separator ("…?" or "…&" in `'https://…?' + qs`) is being concatenated onto: put ours before
    // the page's own params and keep a trailing separator, so neither run into each other.
    const trailing = query === '?' || query.endsWith('&') ? amp : ''
    if (query === '?') query = ''
    else if (query.endsWith('&amp;')) query = query.slice(0, -5)
    else if (query.endsWith('&')) query = query.slice(0, -1)
    const joined = adds.join(amp)
    return `https://${host}${path}${query ? query + amp : '?'}${joined}${trailing}${hash}`
  })

  const visit = text.match(VISIT_SCRIPT)
  if (!visit) return rewrite(text, true)
  const at = visit.index!
  return rewrite(text.slice(0, at), true) + rewrite(visit[0], false) + rewrite(text.slice(at + visit[0].length), true)
}

// A path inside the page's own folder that the ~js passthrough may serve: plain segments only, .js/.mjs.
export function isPassthroughPath(segments: string[]): boolean {
  if (!segments.length || segments.join('/').length > 300) return false
  if (!segments.every(s => /^[A-Za-z0-9._@~ -]+$/.test(s) && s !== '.' && s !== '..')) return false
  return /\.m?js$/i.test(segments[segments.length - 1])
}

// Points every <script src> that is one of the page's own .js files at the ~js passthrough, carrying the request's
// sub_id* along so the passthrough can inject them. Library files go through too: nothing tells them apart here.
export function routeScriptsThroughPassthrough(
  html: string,
  { storageBase, slug, lpPath, subIds }: { storageBase: string; slug: string; lpPath: string; subIds: SubIds },
): string {
  const own = `${storageBase}/${slug}/`
  const extra = subIds.map(([k, v]) => `${k}=${encodeValue(v)}`).join('&')
  return html.replace(/<script\b[^>]*>/gi, tag => tag.replace(/\bsrc=(["'])([^"']+)\1/i, (attr, q: string, src: string) => {
    if (!src.startsWith(own)) return attr
    const rest = src.slice(own.length)
    const split = rest.indexOf('?')
    const file = split === -1 ? rest : rest.slice(0, split)
    const query = split === -1 ? '' : rest.slice(split + 1)
    if (!isPassthroughPath(file.split('/'))) return attr
    const params = [query, extra].filter(Boolean).join('&')
    return `src=${q}${lpPath}${slug}/~js/${file}${params ? '?' + params : ''}${q}`
  }))
}

// Client-side backstop for tracker URLs a page builds at runtime from scratch, which the server never sees. It only
// ever acts on navigations to the known tracker hosts with a one-segment alias, only adds sub_id* the URL lacks, and
// only when the LP URL carries sub_id*. Hooks: link click/auxclick, form submit (+ form.submit()), window.open, and —
// where the browser has the Navigation API (Chromium; not Safari 26.0) — script navigations (location.assign/href=).
// A navigation is cancelled only when it can be re-issued as a plain GET (no POST body, no traverse/reload/download),
// and a re-issued navigation carries a marker so it is never touched twice.
export function backstopScript(trackingHost: string | null): string {
  const hosts = JSON.stringify([...new Set([...TRACKER_HOSTS, ...(trackingHost ? [trackingHost.toLowerCase()] : [])])])
  return `<script>(function(){try{var H=${hosts},S=[],Q=new URLSearchParams(location.search);` +
    `Q.forEach(function(v,k){if(S.length<${MAX_SUB_IDS}&&/^sub_id[A-Za-z0-9_]{0,8}$/.test(k)&&v&&v.length<=${MAX_VALUE}&&!S.some(function(s){return s[0]===k}))S.push([k,v]);});if(!S.length)return;` +
    `function enc(v){return encodeURIComponent(v).replace(/[!'()*]/g,function(c){return '%'+c.charCodeAt(0).toString(16).toUpperCase();});}` +
    `function trk(u){var x;try{x=new URL(u,location.href);}catch(e){return null;}if((x.protocol!=='https:'&&x.protocol!=='http:')||H.indexOf(x.hostname.toLowerCase())<0||!/^\\/[A-Za-z0-9_-]+$/.test(x.pathname))return null;return x;}` +
    `function fix(u){var x=trk(u);if(!x)return null;var add='';S.forEach(function(s){if(!x.searchParams.has(s[0]))add+='&'+s[0]+'='+enc(s[1]);});if(!add)return null;var h=x.href,i=h.indexOf('#'),hash=i<0?'':h.slice(i);if(i>=0)h=h.slice(0,i);h=h.replace(/[?&]+$/,'');return h+(h.indexOf('?')<0?'?':'&')+add.slice(1)+hash;}` +
    `function onClick(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var f=fix(a.getAttribute('href'));if(f)a.setAttribute('href',f);}` +
    `document.addEventListener('click',onClick,true);document.addEventListener('auxclick',onClick,true);` +
    `function onForm(f){if(!f||!f.getAttribute)return;var act=f.getAttribute('action');if(act===null||!trk(act))return;if((f.getAttribute('method')||'get').toLowerCase()==='get'){S.forEach(function(s){if(f.elements&&f.elements.namedItem&&f.elements.namedItem(s[0]))return;var i=document.createElement('input');i.type='hidden';i.name=s[0];i.value=s[1];f.appendChild(i);});}else{var g=fix(act);if(g)f.setAttribute('action',g);}}` +
    `document.addEventListener('submit',function(e){onForm(e.target);},true);` +
    `var fs=HTMLFormElement.prototype.submit;HTMLFormElement.prototype.submit=function(){onForm(this);return fs.apply(this,arguments);};` +
    `var wo=window.open;window.open=function(u){var a=Array.prototype.slice.call(arguments);if(u!=null){var f=fix(String(u));if(f)a[0]=f;}return wo.apply(window,a);};` +
    `var N=window.navigation,M='subid-backstop';if(N&&window.top===window){N.addEventListener('navigate',function(e){if(e.info===M||!e.cancelable||e.hashChange||e.downloadRequest!=null||e.formData||e.navigationType==='traverse'||e.navigationType==='reload')return;var f=fix(e.destination&&e.destination.url);if(!f)return;e.preventDefault();var o={info:M,history:e.navigationType==='replace'?'replace':'auto'};try{N.navigate(f,o);}catch(x){location.assign(f);}});}` +
    `}catch(e){}})();</script>`
}
