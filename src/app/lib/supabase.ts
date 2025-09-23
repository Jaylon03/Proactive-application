import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client factory - only call this server-side
export const createSupabaseAdmin = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

// Database types (add more as needed)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: 'free' | 'starter' | 'professional'
          subscription_status: 'active' | 'inactive' | 'canceled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_tier?: 'free' | 'starter' | 'professional'
          subscription_status?: 'active' | 'inactive' | 'canceled'
        }
        Update: {
          full_name?: string | null
          subscription_tier?: 'free' | 'starter' | 'professional'
          subscription_status?: 'active' | 'inactive' | 'canceled'
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          website: string | null
          industry: string | null
          size_category: string | null
          description: string | null
          logo_url: string | null
          linkedin_url: string | null
          careers_page_url: string | null
          employee_count: number | null
          created_at: string
          updated_at: string
        }
      }
      user_company_tracks: {
        Row: {
          id: string
          user_id: string
          company_id: string
          notification_preferences: any
          created_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          notification_preferences?: any
        }
      }
      waitlist: {
        Row: {
          id: string
          email: string
          source: string
          created_at: string
        }
        Insert: {
          email: string
          source?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          company_id: string
          alert_type: 'hiring_signal' | 'job_opportunity' | 'networking_tip'
          title: string
          message: string
          data: any | null
          sent_at: string
          read_at: string | null
          clicked_at: string | null
        }
      }
      hiring_signals: {
        Row: {
          id: string
          company_id: string
          signal_type: string
          title: string
          description: string | null
          confidence_score: number | null
          source_url: string | null
          detected_at: string
        }
      }
    }
  }
}