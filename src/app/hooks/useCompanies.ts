import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'


export interface Company {
  id: string
  name: string
  industry: string | null
  employee_count: number | null
  website: string | null
  size_category: string | null
  description: string | null
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
          .select('id, name, industry, employee_count, website, size_category, description')
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