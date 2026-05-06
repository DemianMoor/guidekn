import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  BRAND_SYSTEM_PROMPT,
  articleDraftPrompt,
  PILLARS,
  type PillarSlug,
} from "@/lib/brand-voice";

// Allow up to 60 seconds for the AI generation
export const maxDuration = 60;

// Schema for what Claude returns — Vercel AI SDK validates against this
const articleSchema = z.object({
  title: z.string().min(1).max(200),
  dek: z.string().min(1).max(300),
  body: z.string().min(100),
  image_suggestion: z.string().min(1).max(500),
});

const VALID_PILLARS = Object.keys(PILLARS) as PillarSlug[];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  // Verify admin
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json(
      { error: "Not authorized." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const topic = (body?.topic ?? "").toString().trim();
  const pillar = (body?.pillar ?? "").toString().trim();
  const notes = (body?.notes ?? "").toString().trim() || undefined;

  if (!topic) {
    return NextResponse.json(
      { error: "Please provide a topic." },
      { status: 400 }
    );
  }

  if (!VALID_PILLARS.includes(pillar as PillarSlug)) {
    return NextResponse.json(
      { error: "Please pick a valid pillar." },
      { status: 400 }
    );
  }

  try {
    // Generate the article — uses Claude Haiku for speed/cost,
    // can swap to Sonnet/Opus for higher quality later
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: articleSchema,
      system: BRAND_SYSTEM_PROMPT,
      prompt: articleDraftPrompt({
        topic,
        pillar: pillar as PillarSlug,
        byline: editor.display_name,
        notes,
      }),
      temperature: 0.7,
      maxRetries: 2,
    });

    // Save as a draft
    const supabase = createSupabaseAdmin();

    // Generate a unique slug — append number if taken
    let slug = slugify(object.title);
    let attempt = 0;
    while (attempt < 5) {
      const { data: existing } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      slug = `${slugify(object.title)}-${attempt + 1}`;
    }

    const { data: article, error: dbError } = await supabase
      .from("articles")
      .insert({
        title: object.title,
        slug,
        pillar,
        dek: object.dek,
        body: object.body,
        byline: editor.display_name,
        author_id: editor.id,
        image_alt: object.image_suggestion,
        status: "draft",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to save draft:", dbError);
      return NextResponse.json(
        { error: "Generated article but failed to save it. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (err) {
    console.error("AI draft generation error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json(
      {
        error: `Couldn't generate the draft: ${message}`,
      },
      { status: 500 }
    );
  }
}