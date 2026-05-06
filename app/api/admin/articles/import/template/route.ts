import { NextResponse } from "next/server";
import { getCurrentEditor } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = [
  "title",
  "slug",
  "pillar",
  "dek",
  "body",
  "byline",
  "image_url",
  "image_alt",
  "image_credit",
  "image_search_terms",
  "seo_title",
  "seo_description",
  "status",
  "published_at",
];

// Helper: wrap a value in quotes and escape internal quotes by doubling them
function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

const EXAMPLE_ROWS = [
  {
    title: "Why hip mobility matters more than knee mobility after 50",
    slug: "hip-mobility-after-50",
    pillar: "body",
    dek: "The joint nobody trains is the one that decides how you'll move at 70.",
    body: `Most people in their 50s worry about their knees. Their hips are quietly the bigger story.

## What the research says

A 2023 study in the Journal of Orthopaedic Research followed adults aged 50 to 70 over four years. Hip range of motion predicted falls and stair-climbing ability more reliably than knee strength.

## Two movements that matter

The 90/90 hip stretch and the standing leg swing — both five minutes a day — restored meaningful mobility in 8 weeks for most participants.

## The takeaway

If you're choosing what to train, pick hips first. Knees benefit from hip work; the reverse is rarely true.`,
    byline: "The Guide Kin team",
    image_url: "",
    image_alt: "",
    image_credit: "",
    image_search_terms: "older adult hip stretch yoga, mature woman 90/90 stretch home",
    seo_title: "Hip mobility for adults 50+: why it matters more than knees",
    seo_description: "Hip range of motion predicts falls and stair-climbing better than knee strength. Two movements, five minutes a day.",
    status: "draft",
    published_at: "",
  },
  {
    title: "The friendship audit nobody talks about",
    slug: "friendship-audit",
    pillar: "bonds",
    dek: "How to honestly assess which relationships are giving and which are draining, without burning bridges.",
    body: `Some friendships are seasons. Some are lifetimes. Most of us never sit down and ask which is which.

## The simple frame

For each close tie, ask two questions: Do I leave our time together energized or depleted? Would I choose this person if we met today?

## What changes after 40

Time gets scarcer and so does tolerance for one-sided maintenance. That isn't selfishness — it's clarity.

## The graceful exit

Most fading friendships don't need a conversation. They need consistent honesty about what you say yes to.`,
    byline: "The Guide Kin team",
    image_url: "",
    image_alt: "",
    image_credit: "",
    image_search_terms: "two women coffee conversation candid, mature friends walking park honest talk",
    seo_title: "The friendship audit: assessing close ties in midlife",
    seo_description: "How to honestly evaluate which friendships are giving and which are draining, without burning bridges.",
    status: "draft",
    published_at: "",
  },
];

export async function GET() {
  // Auth check — only signed-in editors can download
  const editor = await getCurrentEditor();
  if (!editor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lines: string[] = [];
  lines.push(HEADERS.join(","));

  for (const row of EXAMPLE_ROWS) {
    const values = HEADERS.map((h) => {
      const v = (row as Record<string, string>)[h] ?? "";
      return csvEscape(v);
    });
    lines.push(values.join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="guidekin-articles-template.csv"`,
    },
  });
}