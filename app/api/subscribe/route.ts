import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createSupabaseAdmin } from "@/lib/supabase";
import WelcomeEmail from "@/emails/welcome-email";

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
    } = body as {
      name?: string;
      email?: string;
      phone?: string;
      pillars?: string[];
      consent_email?: boolean;
      consent_sms?: boolean;
    };

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!consent_email && !consent_sms) {
      return NextResponse.json(
        {
          error:
            "Please consent to email or SMS so we know how to reach you.",
        },
        { status: 400 }
      );
    }

    if (consent_sms && (!phone || phone.trim().length === 0)) {
      return NextResponse.json(
        {
          error:
            "Please add your phone number if you'd like the SMS digest.",
        },
        { status: 400 }
      );
    }

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

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const { error: dbError } = await supabase.from("subscribers").upsert(
      {
        name: cleanName,
        email: cleanEmail,
        phone: phone?.trim() || null,
        pillars: validPillars,
        consent_email: !!consent_email,
        consent_sms: !!consent_sms,
        consent_email_at: consent_email ? now : null,
        consent_sms_at: consent_sms ? now : null,
        consent_ip: ip,
        consent_user_agent: userAgent,
        status: "active",
      },
      { onConflict: "email" }
    );

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        {
          error:
            "Something went wrong saving your subscription. Please try again.",
        },
        { status: 500 }
      );
    }

   // Send welcome email if they consented to email
    console.log("📧 Email block reached. consent_email:", consent_email);

    if (consent_email) {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromAddress =
        process.env.RESEND_FROM_ADDRESS || "Guide Kin <onboarding@resend.dev>";

      console.log("📧 RESEND_API_KEY present?", !!resendApiKey, "starts with:", resendApiKey?.slice(0, 5));
      console.log("📧 fromAddress:", fromAddress);

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
              emailConsent: !!consent_email,
              smsConsent: !!consent_sms,
            })
          );

          const { error: emailError } = await resend.emails.send({
            from: fromAddress,
            to: cleanEmail,
            subject: "Welcome to Guide Kin",
            html,
          });

          if (emailError) {
            console.error("Resend send error:", emailError);
            // Subscription succeeded, email failed — don't block user.
          }
        } catch (err) {
          console.error("Resend exception:", err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe route error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}