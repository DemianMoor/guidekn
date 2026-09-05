import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies the `?lpcheck=` signed preview token minted by the admin panel's
 * landing-page checker.
 *
 * A valid token lets the checker load a page that is not yet active, so it can
 * drive a real browser over the SERVED page and prove every CTA resolves
 * through the tracker before the page goes live. What it sees has to be what a
 * visitor would see, so the token relaxes exactly one thing — the `is_active`
 * filter on the row lookup. Nothing else about the response changes.
 *
 * Wire format and signed message (identical in every brand repo and in the
 * minter — a mismatch fails closed and the page never activates):
 *
 *     lpcheck = "<check_id>.<exp>.<sig>"
 *     message = "lpcheck.v1|" + slug + "|" + check_id + "|" + exp
 *     sig     = HMAC_SHA256(LP_CHECK_CALLBACK_SECRET, message)  -> lowercase hex
 *
 * `slug` is always the route's own param, never a value read back out of the
 * token — that is what stops a token minted for slug A previewing slug B.
 * `lpcheck.v1` is domain separation so a signature can never be confused with
 * one from the checker's HMAC callback.
 *
 * If `LP_CHECK_CALLBACK_SECRET` is unset or empty this returns false for every
 * input, so preview mode simply does not exist until the secret is deployed.
 * Every rejection returns the same plain `false`: the caller must not be able
 * to tell "no token" from "bad token".
 */

const CHECK_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EXP_RE = /^[0-9]{1,15}$/;
const SIG_RE = /^[0-9a-f]{64}$/;

export function isValidPreviewToken(
  token: string | null,
  slug: string,
): boolean {
  // 1. No secret -> no preview mode at all.
  const secret = process.env.LP_CHECK_CALLBACK_SECRET;
  if (!secret) return false;

  // 2. Shape, before any crypto. "." cannot occur inside any of the three
  //    fields, so the split is unambiguous.
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [checkId, exp, sig] = parts;
  if (!CHECK_ID_RE.test(checkId)) return false;
  if (!EXP_RE.test(exp)) return false;
  if (!SIG_RE.test(sig)) return false;

  // 3. Recompute and compare timing-safely. Both sides are 64 lowercase hex
  //    characters (SIG_RE guarantees it for the supplied half), so the buffers
  //    are always the same length and timingSafeEqual cannot throw.
  const message = `lpcheck.v1|${slug}|${checkId}|${exp}`;
  const expected = createHmac("sha256", secret).update(message).digest("hex");
  const ok = timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(sig, "utf8"),
  );
  if (!ok) return false;

  // 4. Expiry last.
  return Number(exp) > Date.now();
}
