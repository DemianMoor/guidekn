/**
 * TrustedForm Certify config. The script is public (not a secret); the
 * `l=` cache-buster is appended at request time. Toggle with
 * TRUSTEDFORM_ENABLED=true|false.
 */
export const TRUSTEDFORM_SCRIPT_URL =
  "https://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&use_tagged_consent=true";

export const TRUSTEDFORM_NOSCRIPT_URL = "https://api.trustedform.com/ns.gif";

export const TRUSTEDFORM_FIELD = "xxTrustedFormCertUrl";

/** Script src with the official `l=` cache-buster (getTime() + random). */
export function trustedFormScriptSrc(): string {
  return `${TRUSTEDFORM_SCRIPT_URL}&l=${new Date().getTime() + Math.random()}`;
}

export function isTrustedFormEnabled(): boolean {
  return process.env.TRUSTEDFORM_ENABLED === "true";
}

/** Accept only https://cert.trustedform.com/... certificate URLs. */
export function parseTrustedFormCertUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 512) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "cert.trustedform.com") return null;
    if (url.pathname.length <= 1) return null;
    return url.toString();
  } catch {
    return null;
  }
}
