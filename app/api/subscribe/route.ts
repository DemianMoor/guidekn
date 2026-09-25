import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createSupabaseAdmin } from "@/lib/supabase";
import WelcomeEmail from "@/emails/welcome-email";
import { listUnsubscribeHeaders, unsubscribePageUrl } from "@/lib/unsubscribe";
import { safeError } from "@/lib/log-safe";

const VALID_PILLARS = ["body", "mind", "glow", "roam", "bonds", "years"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      pillars,
      consent_email,
      consent_sms,
      tcpa_accepted,
    } = body as {
      name?: string;
      email?: string;
      phone?: string;
      pillars?: string[];
      consent_email?: boolean;
      consent_sms?: boolean;
      tcpa_accepted?: boolean;
    };

    // The popup form sends `tcpa_accepted` instead of separate consent flags.
    // Treat it as email consent (TCPA covers electronic marketing).
    const effectiveConsentEmail = consent_email ?? !!tcpa_accepted;
    const effectiveConsentSms = !!consent_sms;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!effectiveConsentEmail && !effectiveConsentSms) {
      return NextResponse.json(
        {
          error:
            "Please consent to email or SMS so we know how to reach you.",
        },
        { status: 400 }
      );
    }

    if (effectiveConsentSms && (!phone || phone.trim().length === 0)) {
      return NextResponse.json(
        {
          error:
            "Please add your phone number if you'd like the SMS digest.",
        },
        { status: 400 }
      );
    }

    // Name is optional — popup-sourced subscribers don't supply one.
    // Fall back to the email's local-part so downstream code (e.g. welcome
    // email greeting) always has something to render.
    const rawName =
      name && typeof name === "string" && name.trim().length > 0
        ? name.trim()
        : email.split("@")[0];

    const validPillars = Array.isArray(pillars)
      ? pillars.filter((p) => VALID_PILLARS.includes(p))
      : [];

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;
    const now = new Date().toISOString();

    const supabase = createSupabaseAdmin();

    const cleanName = rawName;
    const cleanEmail = email.trim().toLowerCase();

    // Merge into an existing subscriber: keep existing pillars and add new
    // ones, and never drop a consent already on file (e.g. SMS consent given
    // on /sub-health). A consent timestamp moves only when that consent is
    // given in this submission.
    const { data: existing, error: lookupError } = await supabase
      .from("subscribers")
      .select("id, phone, pillars, consent_email, consent_sms, email_consent_at, sms_consent_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    const fields = {
      name: cleanName,
      phone: phone?.trim() || existing?.phone || null,
      consent_email: effectiveConsentEmail || !!existing?.consent_email,
      consent_sms: effectiveConsentSms || !!existing?.consent_sms,
      email_consent_at: effectiveConsentEmail ? now : existing?.email_consent_at ?? null,
      sms_consent_at: effectiveConsentSms ? now : existing?.sms_consent_at ?? null,
      ip_address: ip,
      user_agent: userAgent,
      status: "active",
    };

    const { data: subscriber, error: dbError } = lookupError
      ? { data: null, error: lookupError }
      : existing
        ? await supabase
            .from("subscribers")
            .update({
              ...fields,
              pillars: VALID_PILLARS.filter(
                (p) => validPillars.includes(p) || existing.pillars?.includes(p)
              ),
            })
            .eq("id", existing.id)
            .select("id")
            .single()
        : await supabase
            .from("subscribers")
            .insert({ ...fields, email: cleanEmail, pillars: validPillars })
            .select("id")
            .single();

    if (dbError || !subscriber) {
      console.error("Supabase insert error:", safeError(dbError));
      return NextResponse.json(
        {
          error:
            "Something went wrong saving your subscription. Please try again.",
        },
        { status: 500 }
      );
    }

    // Send welcome email if they consented to email
    if (effectiveConsentEmail) {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromAddress =
        process.env.RESEND_FROM_ADDRESS || "GuideKin <onboarding@resend.dev>";

      if (!resendApiKey) {
        // Don't fail the subscription if email is misconfigured — just log it.
        console.error("RESEND_API_KEY is not set. Welcome email not sent.");
      } else {
        try {
          const resend = new Resend(resendApiKey);

          const html = await render(
            WelcomeEmail({
              name: cleanName,
              pillars: validPillars,
              emailConsent: effectiveConsentEmail,
              smsConsent: effectiveConsentSms,
              unsubscribeUrl: unsubscribePageUrl(subscriber.id),
            })
          );

          const { error: emailError } = await resend.emails.send({
            from: fromAddress,
            to: cleanEmail,
            subject: "Welcome to GuideKin",
            html,
            headers: listUnsubscribeHeaders(subscriber.id),
          });

          if (emailError) {
            console.error("Resend send error:", safeError(emailError));
            // Subscription succeeded, email failed — don't block user.
          }
        } catch (err) {
          console.error("Resend exception:", safeError(err));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe route error:", safeError(err));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}