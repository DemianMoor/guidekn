import { createSupabaseServerClient, createSupabaseAdmin } from "@/lib/supabase";

export type EditorRecord = {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: "owner" | "editor";
  created_at: string;
};

/**
 * Get the currently signed-in editor (or null if not signed in or not an editor).
 * Use this in any admin page to gatekeep access.
 *
 * If the user is signed in but doesn't have an editors row, this returns null.
 * That means: signing in to Supabase Auth alone isn't enough. The user must
 * also be in our `editors` table.
 */
export async function getCurrentEditor(): Promise<EditorRecord | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  // Look up the user in the editors table by email
  const admin = createSupabaseAdmin();
  const { data: editor } = await admin
    .from("editors")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .single();

  if (!editor) {
    return null;
  }

  // Auto-fill user_id if it wasn't set yet (first time this user signs in)
  if (!editor.user_id) {
    await admin
      .from("editors")
      .update({ user_id: user.id })
      .eq("id", editor.id);
  }

  return editor as EditorRecord;
}