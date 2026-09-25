import { randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { NextRequest, NextResponse, after } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createSupabaseAdmin } from "@/lib/supabase";
import SubHealthConfirmationEmail, {
  SUB_HEALTH_CONFIRMATION_SUBJECT,
} from "@/emails/sub-health-confirmation-email";
import { canonicalJson, sha256Hex } from "@/lib/consent/hash";
import {
  COVERAGE_INTERESTS,
  SUB_HEALTH_CONSENT_VERSIONS,
  consentTextSnapshot,
} from "@/lib/consent/sub-health";
import { isTrustedFormEnabled, parseTrustedFormCertUrl } from "@/lib/trustedform";
import { listUnsubscribeHeaders, unsubscribePageUrl } from "@/lib/unsubscribe";

const FORM_ID = "sub-health";
const RECORDING_BUCKET = "consent-recordings";
const MAX_RECORDING_BYTES = 4 * 1024 * 1024;
const VALID_INTERESTS: string[] = COVERAGE_INTERESTS.map((i) => i.value);

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function str(value: unknown, max = 4096): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

/** Every query param on the landing URL; repeated keys become arrays. */
function queryParams(pageUrl: string | null): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  if (!pageUrl) return params;
  try {
    for (const [k, v] of new URL(pageUrl).searchParams) {
      const prev = params[k];
      params[k] = prev === undefined ? v : [...(Array.isArray(prev) ? prev : [prev]), v];
    }
  } catch {
    // Unparseable URL: keep it verbatim in page_url, no params.
  }
  return params;
}

/**
 * Transactional confirmation, sent for every successful signup regardless of
 * which consents were checked. Failures are logged, never surfaced.
 */
async function sendConfirmationEmail(
  to: string,
  subscriberId: string,
  props: Omit<Parameters<typeof SubHealthConfirmationEmail>[0], "unsubscribeUrl">
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set. Sub-health confirmation not sent.");
    return;
  }
  try {
    const email = SubHealthConfirmationEmail({
      ...props,
      unsubscribeUrl: unsubscribePageUrl(subscriberId),
    });
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM_ADDRESS || "Guide Kin <onboarding@resend.dev>",
      to,
      subject: SUB_HEALTH_CONFIRMATION_SUBJECT,
      html: await render(email),
      text: await render(email, { plainText: true }),
      headers: listUnsubscribeHeaders(subscriberId),
    });
    if (error) console.error("Sub-health confirmation send error:", error);
  } catch (err) {
    console.error("Sub-health confirmation exception:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const body = JSON.parse(String(form.get("payload") ?? "{}"));
    const recording = form.get("recording");

    const email = str(body.email, 320)?.toLowerCase() ?? null;
    const phone = str(body.phone, 40);
    const zip = str(body.zip, 16);
    const consentEmail = body.consent_email === true;
    const consentSms = body.consent_sms === true;
    const interests = Array.isArray(body.interests)
      ? VALID_INTERESTS.filter((i) => body.interests.includes(i))
      : [];
    const consent = SUB_HEALTH_CONSENT_VERSIONS[String(body.consent_version)];

    if (!email || !email.includes("@")) {
      return badRequest("Please enter a valid email address.");
    }
    if (!zip || !/^\d{5}$/.test(zip)) {
      return badRequest("Please enter a valid 5-digit ZIP code.");
    }
    if (interests.length === 0) {
      return badRequest("Please choose at least one type of coverage.");
    }
    if (!consentEmail && !consentSms) {
      return badRequest("Please consent to email or SMS so we know how to reach you.");
    }
    if (consentSms && !phone) {
      return badRequest("Please add your phone number if you'd like to get texts.");
    }
    if (!consent) {
      return badRequest("This page is out of date. Please refresh and try again.");
    }

    const name = str(body.name, 200) ?? email.split("@")[0];
    const pageUrl = str(body.page_url);
    const referrer = str(body.referrer);
    const sourceParams = queryParams(pageUrl);
    const trustedformCertUrl = isTrustedFormEnabled()
      ? parseTrustedFormCertUrl(body.trustedform_cert_url)
      : null;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    const recordId = randomUUID();
    const consentedAt = new Date().toISOString();
    const supabase = createSupabaseAdmin();

    // 1. Session recording (gzip JSON). A missing or failed recording doesn't
    // block the signup; the record then carries recording_path = null.
    let recordingPath: string | null = null;
    let recordingSha256: string | null = null;
    if (recording instanceof Blob && recording.size > 0 && recording.size <= MAX_RECORDING_BYTES) {
      let bytes: Buffer = Buffer.from(await recording.arrayBuffer());
      if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) bytes = gzipSync(bytes);
      const path = `${FORM_ID}/${consentedAt.slice(0, 4)}/${consentedAt.slice(5, 7)}/${recordId}.json.gz`;
      const { error } = await supabase.storage
        .from(RECORDING_BUCKET)
        .upload(path, bytes, { contentType: "application/gzip", upsert: false });
      if (error) {
        console.error("Consent recording upload failed:", error);
      } else {
        recordingPath = path;
        recordingSha256 = sha256Hex(bytes);
      }
    } else if (recording instanceof Blob && recording.size > MAX_RECORDING_BYTES) {
      console.error(`Consent recording too large (${recording.size} bytes), not stored.`);
    }

    // 2. Consent record (append-only), written before the subscriber row so
    // a stored consent always has its proof.
    const { data: existing, error: lookupError } = await supabase
      .from("subscribers")
      .select("id, phone, consent_email, consent_sms, email_consent_at, sms_consent_at, coverage_interests, source")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const subscriberId: string = existing?.id ?? randomUUID();
    const consentText = consentTextSnapshot(consent);

    // Hash input v1: canonicalJson of every column below except record_sha256
    // (and the DB-set inserted_at), with consented_at as an ISO-8601 UTC string.
    const record = {
      id: recordId,
      consented_at: consentedAt,
      form_id: FORM_ID,
      subscriber_id: subscriberId,
      email,
      name,
      phone,
      zip,
      interests,
      consent_email: consentEmail,
      consent_sms: consentSms,
      consent_version: consent.id,
      consent_text: consentText,
      consent_text_sha256: sha256Hex(canonicalJson(consentText)),
      ip_address: ip,
      user_agent: userAgent,
      page_url: pageUrl,
      referrer,
      source_params: sourceParams,
      trustedform_cert_url: trustedformCertUrl,
      recording_path: recordingPath,
      recording_sha256: recordingSha256,
      record_hash_version: 1,
    };
    const { error: recordError } = await supabase
      .from("consent_records")
      .insert({ ...record, record_sha256: sha256Hex(canonicalJson(record)) });
    if (recordError) throw recordError;

    // 3. Subscriber row. Merge into an existing one: keep pillars, add
    // interests, and never drop a consent already on file.
    const subscriberFields = {
      name,
      phone: phone ?? existing?.phone ?? null,
      zip,
      source_params: sourceParams,
      trustedform_cert_url: trustedformCertUrl,
      consent_email: consentEmail || !!existing?.consent_email,
      consent_sms: consentSms || !!existing?.consent_sms,
      email_consent_at: consentEmail ? consentedAt : existing?.email_consent_at ?? null,
      sms_consent_at: consentSms ? consentedAt : existing?.sms_consent_at ?? null,
      ip_address: ip,
      user_agent: userAgent,
      status: "active",
      last_consent_record_id: recordId,
    };
    const { error: subscriberError } = existing
      ? await supabase
          .from("subscribers")
          .update({
            ...subscriberFields,
            coverage_interests: VALID_INTERESTS.filter(
              (i) => interests.includes(i) || existing.coverage_interests?.includes(i)
            ),
            source: existing.source ?? FORM_ID,
            trustedform_cert_url: trustedformCertUrl ?? undefined,
          })
          .eq("id", subscriberId)
      : await supabase.from("subscribers").insert({
          ...subscriberFields,
          id: subscriberId,
          email,
          pillars: [],
          coverage_interests: interests,
          source: FORM_ID,
        });
    if (subscriberError) throw subscriberError;

    after(() =>
      sendConfirmationEmail(email, subscriberId, {
        name: str(body.name, 200),
        interests,
        emailConsent: consentEmail,
        smsConsent: consentSms,
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sub-health route error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
