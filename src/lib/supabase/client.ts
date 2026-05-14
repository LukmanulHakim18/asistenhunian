import { createBrowserClient } from "@supabase/ssr";

// No Database generic: Supabase's GenericTable requires Insert: Record<string, unknown>
// but TypeScript's interface/Omit types don't produce index signatures.
// Use .returns<T>() on select queries for read-time type safety.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
