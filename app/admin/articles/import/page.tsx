import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/admin-auth";
import ImportForm from "./import-form";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const editor = await getCurrentEditor();
  if (!editor) {
    redirect("/admin/signin");
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-serif text-ink mb-2">Bulk import articles</h1>
      <p className="text-ink/70 mb-8">
        Upload a CSV file to create multiple articles at once. Download the example template below
        to see the exact format.
      </p>
      <ImportForm />
    </div>
  );
}