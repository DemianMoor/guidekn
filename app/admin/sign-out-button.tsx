"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/signin");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-ink/70 hover:text-sage cursor-pointer"
    >
      Sign out
    </button>
  );
}