"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// Paths where analytics should NOT load at all.
// /admin/* is excluded entirely; admin sessions don't pollute reader analytics.
function isExcludedPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

/**
 * Pushes page_view events to dataLayer on route changes.
 * Next.js App Router does client-side navigation, which does NOT trigger
 * a normal page load. Without this, GA4 only sees the first page a visitor
 * lands on.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GTM_ID) return;
    if (isExcludedPath(pathname)) return;
    if (typeof window === "undefined") return;

    window.dataLayer = window.dataLayer || [];
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    window.dataLayer.push({
      event: "page_view",
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Loads GTM (which in turn loads GA4 and Clarity).
 * Skips loading on admin paths entirely.
 */
export function Analytics() {
  const pathname = usePathname();

  if (!GTM_ID) return null;
  if (isExcludedPath(pathname)) return null;

  return (
    <>
      <Script id="gtm-loader" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>

      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
