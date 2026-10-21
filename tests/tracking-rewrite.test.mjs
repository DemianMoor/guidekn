// Proves the serve-time rewriter points every known tracker host at the serving brand's tracker and tags every
// campaign click with that brand's source exactly once. Same file in every brand repo; it runs each brand's config.
// Run: npm test   (built-in Node test runner, no packages)
import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteTrackingUrls } from "../lib/subid-guarantee/core.ts";

const BRANDS = [
  { domain: "go.gdkn.org", source: "guidekin" },
  { domain: "go.lumzen.co", source: "lumzen" },
  { domain: "go.fitsyou.net", source: "fitsyou" },
];
const FOREIGN = /go\.gdkn\.org|go\.lumzen\.co|go\.fitsyou\.net|sms\.blogcascade\.com/gi;

// The visit script as each brand stores it: already on that brand's own host, served exactly as stored.
const visit = host => `<template id="keitaro-direct"><script>window.KTracking={R_PATH: 'https://${host}/ZttBSV', P_PATH:'https://${host}/e752675/postback'};a.src='https://${host}/js/k.min.js';</script><noscript><img src='https://${host}/ZttBSV'/></noscript></template>`;

// A shared page after injection: tracker CTAs in every form and from every brand, plus inline-script offers.
const page = host => `<html><head>${visit(host)}</head><body>
<a class="cta" href="https://go.gdkn.org/ZttBSV">Go</a>
<a class="cta" href="https://go.gdkn.org/lld13531?utm_campaign=x&amp;ref=1">Go 2</a>
<a class="cta" href="https://go.gdkn.org/lld13531?source=partner">Already tagged</a>
<a class="cta" href="https://go.lumzen.co/lz1?sub_id1=a">LumZen</a>
<a class="cta" href="http://GO.FITSYOU.NET/fy1">FitsYou</a>
<a class="cta" href="https://sms.blogcascade.com/bc1">Blog Cascade</a>
<a href="tel:+12345">call</a><a href="#top">top</a>
<script>var CONFIG = { ADVERTISER_URL: 'https://sms.blogcascade.com/sas42169' }; var OFFER_URL = "https://go.lumzen.co/pgtsl";</script>
</body></html>`;

const hrefs = html => [...html.matchAll(/class="cta" href="([^"]+)"/g)].map(m => m[1]);

for (const b of BRANDS) {
  const out = rewriteTrackingUrls(page(b.domain), b);
  const t = `[${b.domain}]`;

  test(`${t} served page carries no other brand's tracker host`, () => {
    assert.deepEqual([...new Set(out.match(FOREIGN).map(h => h.toLowerCase()))], [b.domain]);
  });

  test(`${t} every CTA points at the brand's tracker with its source`, () => {
    assert.deepEqual(hrefs(out), [
      `https://${b.domain}/ZttBSV?source=${b.source}`,
      `https://${b.domain}/lld13531?utm_campaign=x&amp;ref=1&amp;source=${b.source}`,
      `https://${b.domain}/lld13531?source=partner`,
      `https://${b.domain}/lz1?sub_id1=a&source=${b.source}`,
      `https://${b.domain}/fy1?source=${b.source}`,
      `https://${b.domain}/bc1?source=${b.source}`,
    ]);
  });

  test(`${t} URLs inside inline scripts are rewritten too`, () => {
    assert.match(out, new RegExp(`ADVERTISER_URL: 'https://${b.domain}/sas42169\\?source=${b.source}'`));
    assert.match(out, new RegExp(`OFFER_URL = "https://${b.domain}/pgtsl\\?source=${b.source}"`));
  });

  test(`${t} a URL already on the brand's own host gets source=`, () => {
    assert.equal(rewriteTrackingUrls(`<a href="https://${b.domain}/own1">x</a>`, b), `<a href="https://${b.domain}/own1?source=${b.source}">x</a>`);
  });

  test(`${t} the visit script is served exactly as stored`, () => {
    assert.ok(out.includes(visit(b.domain)));
    assert.doesNotMatch(out.slice(0, out.indexOf("</template>")), /source=/);
  });

  test(`${t} rewriter is idempotent`, () => {
    assert.equal(rewriteTrackingUrls(out, b), out);
  });

  test(`${t} non-tracker links are untouched`, () => {
    assert.match(out, /href="tel:\+12345"/);
    assert.match(out, /href="#top"/);
  });
}

test("without a tracking domain the page is served as uploaded", () => {
  const html = page("go.gdkn.org");
  assert.equal(rewriteTrackingUrls(html, { domain: null, source: null }), html);
  assert.equal(rewriteTrackingUrls(html, { domain: "  ", source: "x" }), html);
});

test("only exact tracker hosts match: admin.gdkn.org and lookalikes are left alone", () => {
  const html = '<a href="https://admin.gdkn.org/x">a</a><a href="https://go.gdkn.org.example.com/x">b</a><a href="https://go.lumzen.co.evil.com/x">c</a><a href="https://xgo.fitsyou.net/x">d</a><a href="https://sms.blogcascade.com.evil.com/x">e</a><a href="https://example.com/ZttBSV">f</a>';
  assert.equal(rewriteTrackingUrls(html, BRANDS[1]), html);
});

test("infrastructure paths are host-swapped but never tagged", () => {
  assert.equal(
    rewriteTrackingUrls("<script src='https://go.gdkn.org/js/k.min.js'></script>", BRANDS[2]),
    "<script src='https://go.fitsyou.net/js/k.min.js'></script>",
  );
});
