// src/app/hooks/useCompanies.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

export interface Company {
  id: string
  name: string
  website: string | null
  careers_page_url: string | null
  linkedin_url: string | null
  industry: string | null
  size_category: string | null
  logo_url: string | null
  description: string | null
  headquarters_location: string | null
  created_at: string
  updated_at: string
}

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name')

        if (error) throw error
        setCompanies(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  return { companies, loading, error }
}