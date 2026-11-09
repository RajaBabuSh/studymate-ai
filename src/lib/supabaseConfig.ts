/**
 * StudyMate AI – Supabase Configuration Validator
 * Validates Supabase project URL and API keys to ensure:
 * 1. URL strictly follows https://YOUR_PROJECT_REF.supabase.co
 * 2. API keys, Dashboard URLs, and PostgreSQL connection strings are detected and rejected with clear error messages
 * 3. Never throws uncaught runtime errors during Next.js build or SSR
 */

export type SupabaseUrlErrorType =
  | "MISSING"
  | "EMPTY"
  | "INCOMPLETE_URL"
  | "API_KEY_USED_AS_URL"
  | "DATABASE_STRING_USED_AS_URL"
  | "DASHBOARD_URL_USED"
  | "PLACEHOLDER_USED"
  | "INVALID_PROTOCOL"
  | "INVALID_HOSTNAME"
  | "MALFORMED_URL";

export interface SupabaseUrlValidationResult {
  isValid: boolean;
  url: string;
  errorMessage: string | null;
  projectRef: string | null;
  errorType: SupabaseUrlErrorType | null;
}

export interface SupabaseKeyValidationResult {
  isValid: boolean;
  key: string;
  errorMessage: string | null;
  errorType: "MISSING" | "EMPTY" | "PLACEHOLDER_USED" | "TOO_SHORT" | null;
}

/**
 * Trims whitespace and removes enclosing quotes ("..." or '...').
 */
export function cleanString(val?: string | null): string {
  if (!val) return "";
  let trimmed = String(val).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * Validates that a string is a valid Supabase project URL.
 * Expected format: https://YOUR_PROJECT_REF.supabase.co (or http://localhost:port for local development)
 */
export function validateSupabaseUrl(rawUrl?: string | null): SupabaseUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return {
      isValid: false,
      url: "",
      errorMessage:
        "NEXT_PUBLIC_SUPABASE_URL is missing. Expected format: https://YOUR_PROJECT_REF.supabase.co",
      projectRef: null,
      errorType: "MISSING",
    };
  }

  let cleaned = cleanString(rawUrl).replace(/\/+$/, "");

  if (!cleaned) {
    return {
      isValid: false,
      url: "",
      errorMessage:
        "NEXT_PUBLIC_SUPABASE_URL is empty after trimming. Expected format: https://YOUR_PROJECT_REF.supabase.co",
      projectRef: null,
      errorType: "EMPTY",
    };
  }

  // Reject bare protocol
  if (
    cleaned === "https://" ||
    cleaned === "http://" ||
    cleaned === "https:" ||
    cleaned === "http:"
  ) {
    return {
      isValid: false,
      url: "",
      errorMessage:
        "NEXT_PUBLIC_SUPABASE_URL only contains the protocol prefix without a project hostname. Expected format: https://YOUR_PROJECT_REF.supabase.co",
      projectRef: null,
      errorType: "INCOMPLETE_URL",
    };
  }

  // 1. Detect API Key or JWT used as URL
  if (
    cleaned.startsWith("eyJ") ||
    cleaned.startsWith("sbp_") ||
    cleaned.startsWith("anon_") ||
    cleaned.startsWith("service_role_") ||
    (!cleaned.includes(".") && cleaned.length > 40)
  ) {
    return {
      isValid: false,
      url: "",
      errorMessage:
        "NEXT_PUBLIC_SUPABASE_URL appears to be an API key or token, not a project URL. Never use an API key as the Supabase project URL. Expected format: https://YOUR_PROJECT_REF.supabase.co",
      projectRef: null,
      errorType: "API_KEY_USED_AS_URL",
    };
  }

  // 2. Detect Database Connection String (PostgreSQL URI)
  if (
    cleaned.startsWith("postgres://") ||
    cleaned.startsWith("postgresql://") ||
    cleaned.includes("pooler.supabase.com") ||
    /:5432(?:\/|$)/.test(cleaned) ||
    /:6543(?:\/|$)/.test(cleaned) ||
    (cleaned.includes("@") && cleaned.includes("postgres"))
  ) {
    return {
      isValid: false,
      url: "",
      errorMessage:
        "NEXT_PUBLIC_SUPABASE_URL appears to be a database connection string. Never use a PostgreSQL connection string (postgres://) as the Supabase project URL. Expected format: https://YOUR_PROJECT_REF.supabase.co",
      projectRef: null,
      errorType: "DATABASE_STRING_USED_AS_URL",
    };
  }

  // 3. Detect Dashboard URL
  if (
    cleaned.includes("supabase.com/dashboard") ||
    cleaned.includes("/dashboard/project/")
  ) {
    const match = cleaned.match(/\/project\/([a-z0-9_-]+)/i);
    const ref = match ? match[1] : null;
    const hint = ref ? ` Did you mean: https://${ref}.supabase.co ?` : "";
    return {
      isValid: false,
      url: "",
      errorMessage: `NEXT_PUBLIC_SUPABASE_URL is set to a Supabase Dashboard URL.${hint} Never use a dashboard URL as the project URL. Expected format: https://YOUR_PROJECT_REF.supabase.co`,
      projectRef: ref,
      errorType: "DASHBOARD_URL_USED",
    };
  }

  // 4. Detect Placeholders
  if (
    cleaned.includes("your-project") ||
    cleaned.includes("YOUR_PROJECT_REF") ||
    cleaned.includes("your_project_ref") ||
    cleaned.includes("<") ||
    cleaned.includes(">") ||
    cleaned.includes("[") ||
    cleaned.includes("]")
  ) {
    return {
      isValid: false,
      url: "",
      errorMessage:
        "NEXT_PUBLIC_SUPABASE_URL contains placeholder text (e.g. YOUR_PROJECT_REF). Please replace it with your actual Supabase project reference: https://YOUR_PROJECT_REF.supabase.co",
      projectRef: null,
      errorType: "PLACEHOLDER_USED",
    };
  }

  // 5. Auto-prepend https:// if entered without protocol
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    cleaned = "https://" + cleaned;
  }

  // 6. Parse URL
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return {
      isValid: false,
      url: "",
      errorMessage: `Invalid supabaseUrl: Provided URL "${cleaned}" is malformed. Expected format: https://YOUR_PROJECT_REF.supabase.co`,
      projectRef: null,
      errorType: "MALFORMED_URL",
    };
  }

  // 7. Validate Protocol
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      isValid: false,
      url: "",
      errorMessage: `Invalid protocol "${parsed.protocol}". Supabase URL must use https:// (or http:// for localhost).`,
      projectRef: null,
      errorType: "INVALID_PROTOCOL",
    };
  }

  // 8. Validate Hostname
  const hostname = parsed.hostname.toLowerCase();
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (!hostname || hostname.length < 3 || (!hostname.includes(".") && !isLocalhost)) {
    return {
      isValid: false,
      url: "",
      errorMessage: `Invalid supabaseUrl: Hostname "${hostname}" is invalid. Expected format: https://YOUR_PROJECT_REF.supabase.co`,
      projectRef: null,
      errorType: "INVALID_HOSTNAME",
    };
  }

  let projectRef: string | null = null;
  if (hostname.endsWith(".supabase.co")) {
    projectRef = hostname.replace(".supabase.co", "");
  }

  const normalized = `${parsed.protocol}//${parsed.host}`;

  return {
    isValid: true,
    url: normalized,
    errorMessage: null,
    projectRef,
    errorType: null,
  };
}

/**
 * Validates a Supabase API key (anon key or service role key).
 */
export function validateSupabaseKey(
  rawKey?: string | null,
  keyName: string = "SUPABASE_KEY"
): SupabaseKeyValidationResult {
  if (!rawKey || typeof rawKey !== "string") {
    return {
      isValid: false,
      key: "",
      errorMessage: `${keyName} is missing. Please configure it in your environment variables.`,
      errorType: "MISSING",
    };
  }

  const cleaned = cleanString(rawKey);

  if (!cleaned) {
    return {
      isValid: false,
      key: "",
      errorMessage: `${keyName} is empty after trimming.`,
      errorType: "EMPTY",
    };
  }

  // Reject placeholder keys
  if (
    cleaned.includes("your-anon-key") ||
    cleaned.includes("your-service-role-key") ||
    cleaned.includes("YOUR_KEY") ||
    cleaned.includes("<") ||
    cleaned.includes(">") ||
    cleaned.includes("[") ||
    cleaned.includes("]")
  ) {
    return {
      isValid: false,
      key: "",
      errorMessage: `${keyName} contains placeholder text. Please replace it with your actual key from Supabase Settings > API.`,
      errorType: "PLACEHOLDER_USED",
    };
  }

  // Minimum length check (JWT or secret keys are at least 20 chars)
  if (cleaned.length < 20) {
    return {
      isValid: false,
      key: "",
      errorMessage: `${keyName} appears too short to be a valid Supabase key (length: ${cleaned.length}).`,
      errorType: "TOO_SHORT",
    };
  }

  return {
    isValid: true,
    key: cleaned,
    errorMessage: null,
    errorType: null,
  };
}

/**
 * Masks a sensitive key for logs or status reports without exposing the secret.
 */
export function maskKey(key?: string | null): string {
  if (!key) return "empty";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)} (len: ${trimmed.length})`;
}
