import { createClient } from "@supabase/supabase-js";

// This client is for SERVER-SIDE use only. It uses the secret service role key
// which bypasses Row Level Security. Never import this file from a client component.
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