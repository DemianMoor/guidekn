import { notFound, redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { ArticleEditor } from "./article-editor";

export default async function ArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  const supabase = createSupabaseAdmin();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !article) {
    notFound();
  }

  return <ArticleEditor article={article} />;
}