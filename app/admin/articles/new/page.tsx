import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import { NewArticleForm } from "./new-article-form";

export default async function NewArticlePage() {
  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  return (
    <div>
      <p className="text-sage text-xs font-medium uppercase tracking-[0.2em]">
        Articles / New
      </p>
      <h1 className="text-ink mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        Draft a new article.
      </h1>
      <p className="text-ink/70 mt-3 max-w-2xl text-sm">
        Write it yourself, or let AI draft a first pass in Guide Kin voice.
        Either way you land in the full editor to refine, add a hero image, and
        publish or schedule.
      </p>

      <NewArticleForm editorName={editor.display_name} />
    </div>
  );
}