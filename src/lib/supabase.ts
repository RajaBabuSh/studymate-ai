import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  validateSupabaseUrl,
  validateSupabaseKey,
  SupabaseUrlValidationResult,
  SupabaseKeyValidationResult,
} from "./supabaseConfig";

/**
 * Validate Browser/Client-Side Supabase Configuration.
 * Browsers can ONLY access variables prefixed with NEXT_PUBLIC_.
 */
export const supabaseUrlValidation: SupabaseUrlValidationResult = validateSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export const supabaseAnonKeyValidation: SupabaseKeyValidationResult = validateSupabaseKey(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrlValidation.isValid && supabaseAnonKeyValidation.isValid
);

export const supabaseConfigurationError: string | null = !isSupabaseConfigured
  ? supabaseUrlValidation.errorMessage ||
    supabaseAnonKeyValidation.errorMessage ||
    "Supabase configuration is incomplete."
  : null;

/**
 * Initializes the client-side Supabase instance safely.
 * Never calls createClient() if the URL is missing, invalid, or malformed.
 * Never throws unhandled errors that break Next.js build or SSR.
 */
function initBrowserSupabase(): SupabaseClient | null {
  if (!supabaseUrlValidation.isValid || !supabaseAnonKeyValidation.isValid) {
    if (typeof window !== "undefined" && supabaseConfigurationError) {
      console.warn(
        `[StudyMate AI] Browser Supabase client disabled: ${supabaseConfigurationError}`
      );
    }
    return null;
  }

  try {
    return createClient(supabaseUrlValidation.url, supabaseAnonKeyValidation.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[StudyMate AI] Safe browser Supabase initialization failed: ${errorMsg}`);
    return null;
  }
}

export const supabase: SupabaseClient | null = initBrowserSupabase();

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return supabase;
}
