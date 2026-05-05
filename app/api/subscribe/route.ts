import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

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

    // Basic validation
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

    // At least one channel of consent must be given
    if (!consent_email && !consent_sms) {
      return NextResponse.json(
        {
          error:
            "Please consent to email or SMS so we know how to reach you.",
        },
        { status: 400 }
      );
    }

    // If they consented to SMS, they must have given a phone number
    if (consent_sms && (!phone || phone.trim().length === 0)) {
      return NextResponse.json(
        {
          error:
            "Please add your phone number if you'd like the SMS digest.",
        },
        { status: 400 }
      );
    }

    // Validate pillars (drop any unknown values silently)
    const validPillars = Array.isArray(pillars)
      ? pillars.filter((p) => VALID_PILLARS.includes(p))
      : [];

    // Capture consent metadata for audit trail
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;
    const now = new Date().toISOString();

    const supabase = createSupabaseAdmin();

    // Upsert: if email already exists, update the existing row.
    // This means re-submitting the form updates preferences, not duplicates.
    const { error } = await supabase.from("subscribers").upsert(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
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

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Something went wrong saving your subscription. Please try again." },
        { status: 500 }
      );
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