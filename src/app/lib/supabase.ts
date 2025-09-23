import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/app/lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser/client-side operations
export const createClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// For legacy compatibility (if needed)
export const supabase = createClient()

// Admin client factory - only call this server-side
export const createSupabaseAdmin = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseServiceRoleKey)
}