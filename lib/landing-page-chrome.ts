import { parse, HTMLElement } from "node-html-parser";
import { getSiteChromeHtml } from "./site-chrome-html";

export type ChromeRow = {
  use_site_chrome: boolean;
  chrome_revert_to: boolean | null;
  chrome_revert_at: string | null;
};

export type EffectiveChromeState = {
  effective: boolean;
  pendingRevertAt: Date | null;
  pendingRevertTo: boolean | null;
};

// Lazy-revert: if chrome_revert_at is in the past, the effective intent is
// already the revert target. The DB row stays stale until something writes
// to it — that's intentional, the route is the source of truth.
export function effectiveChromeState(
  row: ChromeRow,
  now: Date = new Date()
): EffectiveChromeState {
  if (row.chrome_revert_at) {
    const revertAt = new Date(row.chrome_revert_at);
    if (revertAt <= now) {
      return {
        effective: row.chrome_revert_to ?? row.use_site_chrome,
        pendingRevertAt: null,
        pendingRevertTo: null,
      };
    }
    return {
      effective: row.use_site_chrome,
      pendingRevertAt: revertAt,
      pendingRevertTo: row.chrome_revert_to,
    };
  }
  return {
    effective: row.use_site_chrome,
    pendingRevertAt: null,
    pendingRevertTo: null,
  };
}

export type ChromeDetection = {
  headerFound: boolean;
  footerFound: boolean;
};

// Best-effort header/footer locator. We can't require partner HTML to use
// semantic tags, so we walk a chain: semantic tag -> id/class hint ->
// position-based fallback. Returns the matched element or null.
function findHeader(root: HTMLElement): HTMLElement | null {
  const semantic = root.querySelector("header");
  if (semantic) return semantic;

  const body = root.querySelector("body") ?? root;
  const idHit = body.querySelector(
    '[id="header" i], [id="site-header" i], [id="navbar" i], [id="nav" i], [id="topbar" i], [id="masthead" i], [id="main-nav" i]'
  );
  if (idHit) return idHit;

  const classCandidates = body.querySelectorAll(
    '[class*="header" i], [class*="navbar" i], [class*="topbar" i], [class*="masthead" i], [class*="site-nav" i]'
  );
  const classHit = classCandidates.find((el) => !isInsideMatched(el));
  if (classHit) return classHit;

  const firstNav = body.querySelector("nav");
  if (firstNav && isTopLevelOfBody(firstNav, body)) return firstNav;

  return null;
}

function findFooter(root: HTMLElement): HTMLElement | null {
  const semantic = root.querySelector("footer");
  if (semantic) return semantic;

  const body = root.querySelector("body") ?? root;
  const idHit = body.querySelector(
    '[id="footer" i], [id="site-footer" i], [id="page-footer" i], [id="bottom" i]'
  );
  if (idHit) return idHit;

  const classCandidates = body.querySelectorAll(
    '[class*="footer" i], [class*="site-footer" i], [class*="page-footer" i]'
  );
  const classHit = classCandidates.find((el) => !isInsideMatched(el));
  if (classHit) return classHit;

  return null;
}

function isInsideMatched(el: HTMLElement): boolean {
  let p = el.parentNode as HTMLElement | null;
  while (p) {
    if (p.getAttribute && p.getAttribute("data-gk-chrome")) return true;
    p = p.parentNode as HTMLElement | null;
  }
  return false;
}

function isTopLevelOfBody(el: HTMLElement, body: HTMLElement): boolean {
  return el.parentNode === body;
}

export function detectChrome(html: string): ChromeDetection {
  const root = parse(html, { lowerCaseTagName: false, comment: false });
  return {
    headerFound: findHeader(root) !== null,
    footerFound: findFooter(root) !== null,
  };
}

export type ChromeSwapResult = {
  html: string;
  headerFound: boolean;
  footerFound: boolean;
};

// Always injects Guide Kin chrome (per product decision). Best-effort strips
// the partner chrome — if we can't find it, we still inject ours and report
// the miss so the admin can investigate.
export function applyChromeSwap(html: string): ChromeSwapResult {
  const root = parse(html, { lowerCaseTagName: false, comment: false });

  const header = findHeader(root);
  if (header) header.remove();

  const footer = findFooter(root);
  if (footer) footer.remove();

  const { css, headerHtml, footerHtml } = getSiteChromeHtml();
  const styleTag = `<style data-gk-chrome="style">${css}</style>`;

  let out = root.toString();

  const headMatch = out.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertAt = headMatch.index! + headMatch[0].length;
    out = out.substring(0, insertAt) + styleTag + out.substring(insertAt);
  } else {
    out = styleTag + out;
  }

  const bodyOpenMatch = out.match(/<body[^>]*>/i);
  if (bodyOpenMatch) {
    const insertAt = bodyOpenMatch.index! + bodyOpenMatch[0].length;
    out = out.substring(0, insertAt) + headerHtml + out.substring(insertAt);
  } else {
    out = headerHtml + out;
  }

  const bodyCloseMatch = out.match(/<\/body>/i);
  if (bodyCloseMatch) {
    const insertAt = bodyCloseMatch.index!;
    out = out.substring(0, insertAt) + footerHtml + out.substring(insertAt);
  } else {
    out = out + footerHtml;
  }

  return {
    html: out,
    headerFound: header !== null,
    footerFound: footer !== null,
  };
}
