// Plain-HTML mirror of <SiteHeader /> + <SiteFooter /> for injection into
// partner landing pages, which don't load the Next/React/Tailwind runtime.
//
// IMPORTANT: keep this visually in sync with [components/site-header.tsx] and
// [components/site-footer.tsx]. The plain-HTML copy is intentional — see
// CLAUDE.md "Landing pages: site chrome override" for rationale.
//
// All selectors are prefixed `gk-chrome-` so partner CSS doesn't leak in.
// All hrefs are site-root-relative (`/picks`, etc.) and are injected AFTER
// rewriteAssetPaths in app/lp/[slug]/route.ts so they won't be rewritten to
// the Supabase Storage origin.

const SITE_CHROME_CSS = `
.gk-chrome-header, .gk-chrome-footer {
  font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color: #2C2C2A;
  line-height: 1.5;
  box-sizing: border-box;
}
.gk-chrome-header *, .gk-chrome-footer *,
.gk-chrome-header *::before, .gk-chrome-footer *::before,
.gk-chrome-header *::after, .gk-chrome-footer *::after {
  box-sizing: border-box;
}
.gk-chrome-header a, .gk-chrome-footer a { color: inherit; text-decoration: none; }
.gk-chrome-header a:hover, .gk-chrome-footer a:hover { color: #0F6E56; }

.gk-chrome-header {
  background: #FAF8F3;
  border-bottom: 1px solid #D3D1C7;
  padding: 20px 24px;
}
.gk-chrome-header-inner {
  max-width: 1152px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.gk-chrome-logo {
  color: #0F6E56;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.gk-chrome-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 14px;
}
.gk-chrome-cta {
  background: #BA7517;
  color: #ffffff !important;
  padding: 8px 16px;
  border-radius: 9999px;
}
.gk-chrome-cta:hover { color: #ffffff !important; opacity: 0.9; }

.gk-chrome-footer {
  background: #FAF8F3;
  border-top: 1px solid #D3D1C7;
  margin-top: 80px;
  padding: 64px 24px;
}
.gk-chrome-footer-inner { max-width: 1152px; margin: 0 auto; }
.gk-chrome-footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
}
@media (min-width: 768px) {
  .gk-chrome-footer-grid { grid-template-columns: repeat(3, 1fr); }
}
.gk-chrome-footer-brand-name {
  color: #0F6E56;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0;
}
.gk-chrome-footer-tagline {
  color: rgba(44, 44, 42, 0.7);
  font-size: 14px;
  margin: 12px 0 0;
  max-width: 20rem;
}
.gk-chrome-footer-phone {
  color: rgba(44, 44, 42, 0.7);
  font-size: 14px;
  margin: 16px 0 0;
}
.gk-chrome-footer-attribution {
  color: rgba(44, 44, 42, 0.5);
  font-size: 12px;
  margin: 16px 0 0;
}
.gk-chrome-footer-label {
  color: rgba(44, 44, 42, 0.5);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.gk-chrome-footer-list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}
.gk-chrome-footer-list li { font-size: 14px; margin-top: 8px; }
.gk-chrome-footer-list li:first-child { margin-top: 0; }
.gk-chrome-footer-bottom {
  color: rgba(44, 44, 42, 0.6);
  font-size: 12px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #D3D1C7;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
@media (min-width: 768px) {
  .gk-chrome-footer-bottom {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
`.trim();

const SITE_CHROME_HEADER_HTML = `
<header class="gk-chrome-header" data-gk-chrome="header">
  <div class="gk-chrome-header-inner">
    <a href="/" class="gk-chrome-logo">Guide Kin</a>
    <nav class="gk-chrome-nav">
      <a href="/picks">Picks</a>
      <a href="/about">About</a>
      <a href="/subscribe" class="gk-chrome-cta">Subscribe</a>
    </nav>
  </div>
</header>
`.trim();

function footerHtml(): string {
  const year = new Date().getUTCFullYear();
  return `
<footer class="gk-chrome-footer" data-gk-chrome="footer">
  <div class="gk-chrome-footer-inner">
    <div class="gk-chrome-footer-grid">
      <div>
        <p class="gk-chrome-footer-brand-name">Guide Kin</p>
        <p class="gk-chrome-footer-tagline">Live well, longer.</p>
        <p class="gk-chrome-footer-phone"><a href="tel:+15407397346">(540) 739-7346</a></p>
        <p class="gk-chrome-footer-attribution">Operated by Yelow Sp. z o.o.</p>
      </div>
      <div>
        <p class="gk-chrome-footer-label">Read</p>
        <ul class="gk-chrome-footer-list">
          <li><a href="/body">Body</a></li>
          <li><a href="/mind">Mind</a></li>
          <li><a href="/glow">Glow</a></li>
          <li><a href="/roam">Roam</a></li>
          <li><a href="/bonds">Bonds</a></li>
          <li><a href="/years">Years</a></li>
        </ul>
      </div>
      <div>
        <p class="gk-chrome-footer-label">Guide Kin</p>
        <ul class="gk-chrome-footer-list">
          <li><a href="/picks">Picks</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/subscribe">Subscribe</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">SMS Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="gk-chrome-footer-bottom">
      <p>&copy; ${year} Guide Kin. Written for our kin.</p>
      <p>&mdash; the Guide Kin team</p>
    </div>
  </div>
</footer>
`.trim();
}

// Guide Kin's actual favicon assets, served by Next from app/icon.svg and
// app/apple-icon.svg. Site-root-relative — injected AFTER rewriteAssetPaths
// so they aren't rewritten to the Supabase Storage origin.
const SITE_CHROME_FAVICON_HTML = `
<link rel="icon" type="image/svg+xml" href="/icon.svg" data-gk-chrome="favicon">
<link rel="apple-touch-icon" href="/apple-icon.svg" data-gk-chrome="favicon">
`.trim();

export function getSiteChromeHtml(): {
  css: string;
  headerHtml: string;
  footerHtml: string;
  faviconHtml: string;
} {
  return {
    css: SITE_CHROME_CSS,
    headerHtml: SITE_CHROME_HEADER_HTML,
    footerHtml: footerHtml(),
    faviconHtml: SITE_CHROME_FAVICON_HTML,
  };
}
