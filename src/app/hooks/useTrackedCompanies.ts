import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

import { useAuth } from './useAuth'

export const useTrackedCompanies = () => {
  const { user } = useAuth()
  const [trackedCompanies, setTrackedCompanies] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTrackedCompanies(new Set())
      setLoading(false)
      return
    }

    const fetchTrackedCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('user_company_tracks')
          .select('company_id')
          .eq('user_id', user.id)

        if (error) throw error
        
        const companyIds = new Set(data?.map(track => track.company_id) || [])
        setTrackedCompanies(companyIds)
      } catch (err) {
        console.error('Error fetching tracked companies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrackedCompanies()
  }, [user])

  const trackCompany = async (companyId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_company_tracks')
        .insert([{ user_id: user.id, company_id: companyId }])

      if (error) throw error
      
      setTrackedCompanies(prev => new Set([...prev, companyId]))
    } catch (err) {
      console.error('Error tracking company:', err)
    }
  }

  const untrackCompany = async (companyId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_company_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('company_id', companyId)

      if (error) throw error
      
      setTrackedCompanies(prev => {
        const newSet = new Set(prev)
        newSet.delete(companyId)
        return newSet
      })
    } catch (err) {
      console.error('Error untracking company:', err)
    }
  }

  return {
    trackedCompanies,
    loading,
    trackCompany,
    untrackCompany
  }
}