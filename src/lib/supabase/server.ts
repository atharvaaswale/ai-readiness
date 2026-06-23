import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabase() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  client = createClient<Database>(url, key, {
    auth: { persistSession: false },
  })
  return client
}
