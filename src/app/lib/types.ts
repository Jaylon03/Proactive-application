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