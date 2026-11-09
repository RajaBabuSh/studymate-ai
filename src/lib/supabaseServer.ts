import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  validateSupabaseUrl,
  validateSupabaseKey,
  SupabaseUrlValidationResult,
  SupabaseKeyValidationResult,
} from "./supabaseConfig";

/**
 * Server-Side Supabase Environment Resolution & Validation.
 * Resolves only valid Supabase project URLs.
 * Never allows database connection strings (postgres://) or API keys to be treated as URLs.
 */
const rawServerUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL;

export const serverUrlValidation: SupabaseUrlValidationResult = validateSupabaseUrl(rawServerUrl);

const rawServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SERVICE_ROLE_KEY;

export const serviceRoleKeyValidation: SupabaseKeyValidationResult = validateSupabaseKey(
  rawServiceRoleKey,
  "SUPABASE_SERVICE_ROLE_KEY"
);

const rawAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  process.env.SUPABASE_KEY;

export const anonKeyValidation: SupabaseKeyValidationResult = validateSupabaseKey(
  rawAnonKey,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

// Backward-compatible string exports
export const SUPABASE_URL: string = serverUrlValidation.isValid ? serverUrlValidation.url : "";
export const SUPABASE_SERVICE_ROLE_KEY: string = serviceRoleKeyValidation.isValid
  ? serviceRoleKeyValidation.key
  : "";
export const SUPABASE_ANON_KEY: string = anonKeyValidation.isValid ? anonKeyValidation.key : "";

export const isServerSupabaseConfigured: boolean = serverUrlValidation.isValid;

export const serverConfigError: string | null = !serverUrlValidation.isValid
  ? serverUrlValidation.errorMessage
  : !serviceRoleKeyValidation.isValid
  ? serviceRoleKeyValidation.errorMessage
  : null;

/**
 * Returns a privileged Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Only runs server-side in Node.js environment.
 * Bypasses Row Level Security (RLS) safely on the server for admin APIs and auto-confirmation.
 * Never calls createClient() if the URL is invalid or malformed.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!serverUrlValidation.isValid || !serviceRoleKeyValidation.isValid) {
    return null;
  }
  try {
    return createClient(serverUrlValidation.url, serviceRoleKeyValidation.key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SupabaseServer] Failed to create admin client: ${msg}`);
    return null;
  }
}

/**
 * Returns a standard server-side Supabase client using either the service role key
 * or the anon key if service role is not yet configured.
 * Never calls createClient() if the URL is invalid or malformed.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!serverUrlValidation.isValid) return null;
  const key = serviceRoleKeyValidation.isValid
    ? serviceRoleKeyValidation.key
    : anonKeyValidation.isValid
    ? anonKeyValidation.key
    : null;
  if (!key) return null;

  try {
    return createClient(serverUrlValidation.url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SupabaseServer] Failed to create standard client: ${msg}`);
    return null;
  }
}
