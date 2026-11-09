import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Trims whitespace, removes enclosing quotes, and strips trailing slashes.
 */
function cleanEnv(val?: string | null): string {
  if (!val) return "";
  let trimmed = String(val).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed.replace(/\/+$/, "");
}

/**
 * Ensures protocol is present and cleans URL.
 */
function cleanUrl(val?: string | null): string {
  let cleaned = cleanEnv(val);
  if (!cleaned) return "";
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = "https://" + cleaned;
  }
  return cleaned;
}

// Support all standard Supabase environment variable aliases
export const SUPABASE_URL = cleanUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING
);

export const SUPABASE_SERVICE_ROLE_KEY = cleanEnv(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SERVICE_ROLE_KEY
);

export const SUPABASE_ANON_KEY = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  process.env.SUPABASE_KEY
);

export const isServerSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  !SUPABASE_URL.includes("your-project") &&
  SUPABASE_URL.startsWith("https://")
);

/**
 * Returns a privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Only runs server-side in Node.js environment.
 * Bypasses Row Level Security (RLS) safely on the server for admin APIs and auto-confirmation.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isServerSupabaseConfigured || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.error("[SupabaseServer] Failed to create admin client:", err);
    return null;
  }
}

/**
 * Returns a standard server-side Supabase client using either the service role key
 * or the anon key if service role is not yet configured.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isServerSupabaseConfigured) return null;
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) return null;
  try {
    return createClient(SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.error("[SupabaseServer] Failed to create standard client:", err);
    return null;
  }
}
