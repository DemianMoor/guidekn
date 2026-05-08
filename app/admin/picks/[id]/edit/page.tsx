import { notFound, redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { PickEditor } from "./pick-editor";
import type { Pick, PickProduct } from "@/lib/picks-types";

export const dynamic = "force-dynamic";

export default async function PickEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const editor = await getCurrentEditor();
  if (!editor) redirect("/admin/signin");

  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const [{ data: pick }, { data: products }, { data: allCategories }] =
    await Promise.all([
      supabase.from("picks").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("pick_products")
        .select("*")
        .eq("pick_id", id)
        .order("position", { ascending: true }),
      supabase.from("picks").select("category"),
    ]);

  if (!pick) notFound();

  const categories = Array.from(
    new Set(((allCategories ?? []) as { category: string }[]).map((r) => r.category))
  ).sort();

  return (
    <PickEditor
      pick={pick as Pick}
      products={(products ?? []) as PickProduct[]}
      existingCategories={categories}
    />
  );
}
