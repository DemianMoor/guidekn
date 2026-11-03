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

// Switch off: the input, unchanged. Switch on: the script once, just before </body> (appended when there is none).
export function injectPersonalization(html: string, enabled: boolean): string {
  if (!enabled) return html
  const at = html.search(/<\/body\s*>/i)
  return at === -1 ? html + PERSONALIZATION_SCRIPT : html.slice(0, at) + PERSONALIZATION_SCRIPT + html.slice(at)
}
