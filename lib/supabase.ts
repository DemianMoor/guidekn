import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * For Client Components (browser-side).
 * Used in any file that has "use client" at the top.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * For Server Components and Route Handlers.
 * Reads/writes auth cookies so the user's session is available server-side.
 */
export async function createSupabaseServerClient() {
  // Dynamic import so client components don't pull in next/headers
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore
            // since middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin client — uses the service role key.
 * SERVER-SIDE ONLY. Never import from a client component.
 * Bypasses Row Level Security. Use sparingly.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase environment variables are not set. Check .env.local."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
/**
 * Fetch all site settings as a key-value map.
 * Used by marketing pages to get current hero images, bios, etc.
 */
export async function getSiteSettings(): Promise<Record<string, string>> {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase.from("site_settings").select("key, value");

  const settings: Record<string, string> = {};
  if (data) {
    for (const row of data) {
      if (row.value) settings[row.key] = row.value;
    }
  }
  return settings;
}