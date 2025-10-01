// src/app/lib/types.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          preferred_locations: string[] | null
          remote_preference: 'remote_only' | 'hybrid' | 'onsite' | 'no_preference' | null
          salary_min: number | null
          salary_max: number | null
          email_notifications: boolean | null
          notification_frequency: 'instant' | 'daily' | 'weekly' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          preferred_locations?: string[] | null
          remote_preference?: 'remote_only' | 'hybrid' | 'onsite' | 'no_preference' | null
          salary_min?: number | null
          salary_max?: number | null
          email_notifications?: boolean | null
          notification_frequency?: 'instant' | 'daily' | 'weekly' | null
        }
        Update: {
          email?: string
          full_name?: string | null
          preferred_locations?: string[] | null
          remote_preference?: 'remote_only' | 'hybrid' | 'onsite' | 'no_preference' | null
          salary_min?: number | null
          salary_max?: number | null
          email_notifications?: boolean | null
          notification_frequency?: 'instant' | 'daily' | 'weekly' | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          website: string | null
          careers_page_url: string | null
          linkedin_url: string | null
          industry: string | null
          size_category: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          logo_url: string | null
          description: string | null
          headquarters_location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          website?: string | null
          careers_page_url?: string | null
          linkedin_url?: string | null
          industry?: string | null
          size_category?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          logo_url?: string | null
          description?: string | null
          headquarters_location?: string | null
        }
        Update: {
          name?: string
          website?: string | null
          careers_page_url?: string | null
          linkedin_url?: string | null
          industry?: string | null
          size_category?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          logo_url?: string | null
          description?: string | null
          headquarters_location?: string | null
        }
      }
      job_postings: {
        Row: {
          id: string
          company_id: string | null
          title: string
          description: string | null
          department: string | null
          seniority_level: 'entry' | 'intern' | 'new_grad' | null
          location: string | null
          country: string | null
          is_remote: boolean | null
          remote_type: 'fully_remote' | 'hybrid' | 'onsite' | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          job_type: 'full-time' | 'internship' | 'contract' | null
          source_type: string
          source_url: string
          external_id: string | null
          posted_date: string | null
          expires_date: string | null
          is_active: boolean | null
          tech_stack: string[] | null
          dedup_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          title: string
          description?: string | null
          department?: string | null
          seniority_level?: 'entry' | 'intern' | 'new_grad' | null
          location?: string | null
          country?: string | null
          is_remote?: boolean | null
          remote_type?: 'fully_remote' | 'hybrid' | 'onsite' | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          job_type?: 'full-time' | 'internship' | 'contract' | null
          source_type: string
          source_url: string
          external_id?: string | null
          posted_date?: string | null
          expires_date?: string | null
          is_active?: boolean | null
          tech_stack?: string[] | null
          dedup_hash?: string | null
        }
        Update: {
          company_id?: string | null
          title?: string
          description?: string | null
          department?: string | null
          seniority_level?: 'entry' | 'intern' | 'new_grad' | null
          location?: string | null
          country?: string | null
          is_remote?: boolean | null
          remote_type?: 'fully_remote' | 'hybrid' | 'onsite' | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          job_type?: 'full-time' | 'internship' | 'contract' | null
          source_type?: string
          source_url?: string
          external_id?: string | null
          posted_date?: string | null
          expires_date?: string | null
          is_active?: boolean | null
          tech_stack?: string[] | null
          dedup_hash?: string | null
        }
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: 'interested' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'archived' | null
          notes: string | null
          application_date: string | null
          saved_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          status?: 'interested' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'archived' | null
          notes?: string | null
          application_date?: string | null
        }
        Update: {
          status?: 'interested' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'archived' | null
          notes?: string | null
          application_date?: string | null
        }
      }
      job_alerts: {
        Row: {
          id: string
          user_id: string
          alert_name: string
          keywords: string[] | null
          locations: string[] | null
          remote_only: boolean | null
          include_internships: boolean | null
          min_salary: number | null
          is_active: boolean | null
          notification_method: 'email' | 'in_app' | 'both' | null
          last_triggered_at: string | null
          jobs_matched_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alert_name: string
          keywords?: string[] | null
          locations?: string[] | null
          remote_only?: boolean | null
          include_internships?: boolean | null
          min_salary?: number | null
          is_active?: boolean | null
          notification_method?: 'email' | 'in_app' | 'both' | null
          last_triggered_at?: string | null
          jobs_matched_count?: number | null
        }
        Update: {
          alert_name?: string
          keywords?: string[] | null
          locations?: string[] | null
          remote_only?: boolean | null
          include_internships?: boolean | null
          min_salary?: number | null
          is_active?: boolean | null
          notification_method?: 'email' | 'in_app' | 'both' | null
          last_triggered_at?: string | null
          jobs_matched_count?: number | null
        }
      }
      alert_notifications: {
        Row: {
          id: string
          user_id: string
          alert_id: string | null
          job_id: string | null
          notification_type: 'email' | 'in_app'
          message: string | null
          sent_at: string
          read_at: string | null
          clicked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alert_id?: string | null
          job_id?: string | null
          notification_type: 'email' | 'in_app'
          message?: string | null
          sent_at?: string
          read_at?: string | null
          clicked_at?: string | null
        }
        Update: {
          alert_id?: string | null
          job_id?: string | null
          notification_type?: 'email' | 'in_app'
          message?: string | null
          sent_at?: string
          read_at?: string | null
          clicked_at?: string | null
        }
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          search_query: string | null
          filters: any | null
          results_count: number | null
          searched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          search_query?: string | null
          filters?: any | null
          results_count?: number | null
          searched_at?: string
        }
        Update: {
          search_query?: string | null
          filters?: any | null
          results_count?: number | null
          searched_at?: string
        }
      }
    }
  }
}