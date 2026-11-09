import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes("your-project") &&
  supabaseUrl.startsWith("https://")
);

/**
 * Returns a privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Only runs server-side in Node.js environment.
 * Bypasses Row Level Security (RLS) safely on the server for admin APIs and auto-confirmation.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isServerSupabaseConfigured || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Returns a standard server-side Supabase client using either the service role key
 * or the anon key if service role is not yet configured.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isServerSupabaseConfigured) return null;
  const key = serviceRoleKey || anonKey;
  if (!key) return null;
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
