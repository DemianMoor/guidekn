/**
 * Consent copy for the /sub-health signup page, versioned.
 *
 * Never edit a published version in place: stored consent records reference
 * the version ID and must resolve to the exact text the visitor saw. To change
 * any wording (or the partner list), add a new version and point
 * CURRENT_SUB_HEALTH_CONSENT_VERSION at it.
 */

export type SubHealthConsent = {
  id: string;
  /** Email consent checkbox text (the /subscribe email consent, brand spelled "GuideKin"). */
  email: string;
  /** SMS / calls consent checkbox text. */
  sms: string;
  /** Advertiser name inside `sms` (tagged for TrustedForm). */
  smsAdvertiserName: string;
  /** Phrase inside `sms` rendered as a link to /partners. */
  smsPartnersLinkText: string;
  /**
   * Who the offers come from, shown on /partners: a description (hc-v1+) or a
   * list of names (hc-v1-draft).
   */
  partners: string | string[];
};

export const SUB_HEALTH_CONSENT_VERSIONS: Record<string, SubHealthConsent> = {
  "hc-v1-draft": {
    id: "hc-v1-draft",
    email:
      "I consent to receive marketing and editorial emails from GuideKin (operated by Yelow Sp. z o.o.). Frequency varies, typically one email per week. I can unsubscribe any time.",
    sms:
      "By checking this box, I agree to receive recurring marketing text messages, including via automated technology, from GuideKin at the number provided about Medicare, ACA, and health insurance offers from our partners. Consent is not a condition of purchase. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help.",
    smsAdvertiserName: "GuideKin",
    smsPartnersLinkText: "offers from our partners",
    partners: [
      "Partner name placeholder 1",
      "Partner name placeholder 2",
      "Partner name placeholder 3",
    ],
  },
  "hc-v1": {
    id: "hc-v1",
    email:
      "I consent to receive marketing and editorial emails from GuideKin (operated by Yelow Sp. z o.o.). Frequency varies, typically one email per week. I can unsubscribe any time.",
    sms:
      "By checking this box, I agree to receive recurring marketing text messages, including via automated technology, from GuideKin at the number provided about Medicare, ACA, and health insurance offers from our partners. Consent is not a condition of purchase. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help.",
    smsAdvertiserName: "GuideKin",
    smsPartnersLinkText: "offers from our partners",
    partners:
      "GuideKin works with licensed insurance agencies, brokers, and health plan providers to bring you Medicare, ACA, and other health coverage offers. GuideKin is the only sender of our messages; we do not sell or share your phone number with these partners.",
  },
};

export const CURRENT_SUB_HEALTH_CONSENT_VERSION = "hc-v1";

export const CURRENT_SUB_HEALTH_CONSENT =
  SUB_HEALTH_CONSENT_VERSIONS[CURRENT_SUB_HEALTH_CONSENT_VERSION];

export const COVERAGE_INTERESTS = [
  { value: "medicare", label: "Medicare" },
  { value: "aca", label: "ACA / Health Insurance Marketplace" },
  { value: "other_healthcare", label: "Other Healthcare" },
] as const;

/** The consent text exactly as stored (and hashed) with each record. */
export function consentTextSnapshot(c: SubHealthConsent) {
  return {
    email: c.email,
    sms: c.sms,
    partners: c.partners,
    partners_url: "/partners",
  };
}
