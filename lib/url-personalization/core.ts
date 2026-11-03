// Site-wide URL personalization for uploaded landing pages.
//
// IDENTICAL IN EVERY BRAND REPO (gdkn_code, lz_code, fy_code, casc_code): copy the whole lib/url-personalization/
// folder, never edit one copy alone. Pure string work with no imports, so core.test.mjs runs it under plain `node --test`.
//
// CamMan links carry ?zip=<5 digits>&st=<2-letter state>. When the brand's switch is on, the LP route injects one
// client script that fills the page's marked elements from those two values (markup guide: docs in the admin panel
// repo, docs/url-personalization-markup-guide.md):
//   data-fill="zip" | "state" | "state-name"  text replaced by the value; the element's own text is the fallback
//   data-personal                            shown (and its data-default sibling hidden) only when every data-fill
//                                            inside it has a valid value; authored hidden, so it never shows otherwise
//
// The script only ever changes text and visibility of marked elements. It never reads or writes a link, a script or
// any other URL param, and it holds no URL literal, so the tracking rewriter (which runs after it) has nothing to
// change in it. Switch off = this module returns the HTML untouched.

// site_settings key on the key/value brands. Blog Cascade keeps the same switch in its url_personalization column.
export const URL_PERSONALIZATION_KEY = 'url_personalization_enabled'

// On only for an explicit true: the admin writes jsonb `true`, a text column holds "true". Anything else is off.
export function personalizationEnabled(raw: unknown): boolean {
  return raw === true || raw === 'true'
}

// The 50 states + DC.
export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

// Runs where it is injected, just before </body>, so every marker above it is already parsed and the swap happens
// before first paint. Values reach the page only through textContent, and only after validation.
const CLIENT = `(function(){try{
var S=${JSON.stringify(US_STATES)};
var q=new URLSearchParams(location.search);
var z=(q.get('zip')||'').trim(),s=(q.get('st')||'').trim().toUpperCase();
var v={zip:/^[0-9]{5}$/.test(z)?z:'',state:Object.prototype.hasOwnProperty.call(S,s)?s:''};
v['state-name']=v.state?S[v.state]:'';
function val(el){var k=el.getAttribute('data-fill');return Object.prototype.hasOwnProperty.call(v,k)?v[k]:'';}
var f=document.querySelectorAll('[data-fill]');
for(var i=0;i<f.length;i++){var x=val(f[i]);if(x)f[i].textContent=x;}
function pair(el){var n=el.nextElementSibling,p=el.previousElementSibling;if(n&&n.hasAttribute('data-default'))return n;if(p&&p.hasAttribute('data-default'))return p;return null;}
var ps=document.querySelectorAll('[data-personal]');
for(var j=0;j<ps.length;j++){var el=ps[j],fs=el.querySelectorAll('[data-fill]'),ok=fs.length>0;
for(var k=0;k<fs.length;k++)if(!val(fs[k]))ok=false;
if(!ok)continue;var d=pair(el);el.removeAttribute('hidden');el.style.display='';if(d)d.style.display='none';}
}catch(e){}})();`

export const PERSONALIZATION_SCRIPT = `<script>${CLIENT.replace(/\n/g, '')}</script>`

// ---- First name (data-fill="first-name") ---------------------------------------------------------------------------
// Only for a page that carries the marker: everything above is unchanged, and a page without it is served exactly as
// before. CamMan's endpoint takes the visit's sub_id1 and answers 200 {"first_name":"Maria"|null}; the name never
// appears in a URL. Rules (owner-approved): one plain GET with no credentials, started at the top of <head> so it
// overlaps parsing; 300 ms from then, after which the fallback/default stays; text only (textContent); every filled
// element is masked for Clarity; a marker inside a link or button is never filled; nothing is written to the URL, links,
// cookies, storage, the dataLayer or a global. Blocks that use the name stay invisible (space kept, no reflow) until the
// answer or the 300 ms mark, whichever is first, so the headline never visibly swaps.

// The brand's short-link host that is not behind Cloudflare, so a bot challenge can never break the lookup.
export const FIRST_NAME_HOSTS: Record<string, string> = {
  'guidekn.com': 'g.guidekn.com',
  'lumzen.co': 'g.lumzen.co',
  'fitsyou.net': 'g.fitsyou.net',
  'blogcascade.com': 'go.blogcascade.com',
}
export const FIRST_NAME_BUDGET_MS = 300
const FIRST_NAME_MARKER = /data-fill\s*=\s*["']?first-name["'\s>]/i

const FN = '[data-fill="first-name"]'
const FIRST_NAME_STYLE =
  `html[data-up-fn] ${FN},html[data-up-fn] [data-personal]:has(${FN}),` +
  `html[data-up-fn] [data-personal]:has(${FN})+[data-default],html[data-up-fn] [data-default]:has(+[data-personal] ${FN})` +
  `{visibility:hidden}`

const FIRST_NAME_CLIENT = `(function(){try{
var H=${JSON.stringify(FIRST_NAME_HOSTS)},S=${JSON.stringify(US_STATES)};
var q=new URLSearchParams(location.search),t=q.get('sub_id1'),h=H[location.hostname.replace(/^www\\./,'')];
if(!t||!h||!window.fetch)return;
var D=document.documentElement;D.setAttribute('data-up-fn','');
var l=document.createElement('link');l.rel='preconnect';l.href='https:/'+'/'+h;l.crossOrigin='anonymous';document.head.appendChild(l);
var z=(q.get('zip')||'').trim(),s=(q.get('st')||'').trim().toUpperCase(),n='',done=false;
var v={zip:/^[0-9]{5}$/.test(z)?z:'',state:Object.prototype.hasOwnProperty.call(S,s)?s:''};v['state-name']=v.state?S[v.state]:'';
function inCta(e){return !!(e.closest&&e.closest('a,button'));}
function val(e){var k=e.getAttribute('data-fill');if(k==='first-name')return inCta(e)?'':n;return Object.prototype.hasOwnProperty.call(v,k)?v[k]:'';}
function pair(e){var a=e.nextElementSibling,b=e.previousElementSibling;if(a&&a.hasAttribute('data-default'))return a;if(b&&b.hasAttribute('data-default'))return b;return null;}
function fill(e){var x=val(e);if(!x)return;if(e.getAttribute('data-fill')==='first-name')e.setAttribute('data-clarity-mask','true');e.textContent=x;}
function apply(){var f=document.querySelectorAll('${FN}');for(var i=0;i<f.length;i++)fill(f[i]);
var ps=document.querySelectorAll('[data-personal]');for(var j=0;j<ps.length;j++){var e=ps[j];if(!e.querySelector('${FN}'))continue;
var fs=e.querySelectorAll('[data-fill]'),ok=fs.length>0;for(var k=0;k<fs.length;k++)if(!val(fs[k]))ok=false;if(!ok)continue;
for(var m=0;m<fs.length;m++)fill(fs[m]);var d=pair(e);e.removeAttribute('hidden');e.style.display='';if(d)d.style.display='none';}}
function finish(){if(done)return;done=true;clearTimeout(w);if(c)c.abort();apply();D.removeAttribute('data-up-fn');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);}
var c=window.AbortController?new AbortController():null,w=setTimeout(finish,${FIRST_NAME_BUDGET_MS});
fetch('https:/'+'/'+h+'/api/public/first-name?t='+encodeURIComponent(t),{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:c?c.signal:undefined})
.then(function(r){return r.ok?r.json():null}).then(function(j){if(done)return;var x=j&&typeof j.first_name==='string'?j.first_name.trim():'';
if(/^[A-Za-z][A-Za-z' -]{0,39}$/.test(x))n=x;finish();}).catch(function(){finish();});
}catch(e){document.documentElement.removeAttribute('data-up-fn');}})();`

export const FIRST_NAME_HEAD = `<style>${FIRST_NAME_STYLE}</style><script>${FIRST_NAME_CLIENT.replace(/\n/g, '')}</script>`

export function hasFirstNameMarker(html: string): boolean {
  return FIRST_NAME_MARKER.test(html)
}

// Switch off: the input, unchanged. Switch on: the script once, just before </body> (appended when there is none) and,
// only on a page with a first-name marker, FIRST_NAME_HEAD right after <head> (prepended when there is none).
export function injectPersonalization(html: string, enabled: boolean): string {
  if (!enabled) return html
  const at = html.search(/<\/body\s*>/i)
  let out = at === -1 ? html + PERSONALIZATION_SCRIPT : html.slice(0, at) + PERSONALIZATION_SCRIPT + html.slice(at)
  if (hasFirstNameMarker(html)) {
    const head = out.match(/<head[^>]*>/i)
    out = head ? out.slice(0, head.index! + head[0].length) + FIRST_NAME_HEAD + out.slice(head.index! + head[0].length) : FIRST_NAME_HEAD + out
  }
  return out
}
