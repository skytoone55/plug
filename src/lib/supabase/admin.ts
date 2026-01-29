import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Create a fresh admin client each time — avoids connection pool issues
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Lazy singleton for backward compat - only created when accessed
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createAdminClient()
  }
  return _supabaseAdmin
}

// DEPRECATED: Use getSupabaseAdmin() instead
// This getter allows lazy initialization at runtime instead of import time
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient]
  }
})
