import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * Email-only unsubscribe via signed, non-expiring per-subscriber links.
 * Token = HMAC-SHA256(UNSUBSCRIBE_SECRET, "email-unsub:v1:<subscriber_id>").
 * Used by the /unsubscribe page and the RFC 8058 one-click endpoint.
 */

const SITE_URL = "https://www.guidekn.com";

function sign(subscriberId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return createHmac("sha256", secret).update(`email-unsub:v1:${subscriberId}`).digest("base64url");
}

export function verifyUnsubscribeToken(subscriberId: unknown, token: unknown): subscriberId is string {
  if (typeof subscriberId !== "string" || typeof token !== "string") return false;
  if (!/^[0-9a-f-]{36}$/i.test(subscriberId)) return false;
  const expected = Buffer.from(sign(subscriberId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function query(subscriberId: string) {
  return `s=${subscriberId}&t=${sign(subscriberId)}`;
}

/** Footer link: the confirm page. */
export function unsubscribePageUrl(subscriberId: string) {
  return `${SITE_URL}/unsubscribe?${query(subscriberId)}`;
}

/** List-Unsubscribe + List-Unsubscribe-Post (RFC 8058 one-click) headers. */
export function listUnsubscribeHeaders(subscriberId: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE_URL}/api/unsubscribe?${query(subscriberId)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Turns email consent off. SMS consent and status are untouched. Idempotent:
 * an already-unsubscribed row keeps its original timestamp.
 */
export async function unsubscribeEmail(subscriberId: string): Promise<void> {
  const { error } = await createSupabaseAdmin()
    .from("subscribers")
    .update({ consent_email: false, email_unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriberId)
    .eq("consent_email", true);
  if (error) throw error;
}
