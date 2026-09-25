export const dynamic = "force-dynamic";

import Script from "next/script";
import { SubHealthForm } from "./sub-health-form";
import { NoSubscribePopup } from "@/lib/popup-context";
import {
  TRUSTEDFORM_NOSCRIPT_URL,
  isTrustedFormEnabled,
  trustedFormScriptSrc,
} from "@/lib/trustedform";

export const metadata = {
  title: "Medicare and ACA plan information",
  description:
    "Get Medicare and ACA / Health Insurance Marketplace plan information from Guide Kin.",
  // Reached only via partner links.
  robots: { index: false, follow: false },
};

export default function SubHealthPage() {
  const trustedForm = isTrustedFormEnabled();
  return (
    <>
      <NoSubscribePopup />
      <SubHealthForm />
      {trustedForm && (
        <>
          <Script id="trustedform" src={trustedFormScriptSrc()} strategy="afterInteractive" />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TRUSTEDFORM_NOSCRIPT_URL} alt="" />
          </noscript>
        </>
      )}
    </>
  );
}
