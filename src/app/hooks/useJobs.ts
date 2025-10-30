// src/app/hooks/useJobs.ts
import { useState, useEffect, useCallback } from 'react'

export interface JobPosting {
  id: string
  company_id: string
  title: string
  description: string | null
  department: string | null
  seniority_level: 'entry' | 'intern' | 'new_grad'
  location: string | null
  country: string | null
  is_remote: boolean
  remote_type: 'fully_remote' | 'hybrid' | 'onsite' | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  job_type: 'full-time' | 'internship' | 'contract'
  source_type: string
  source_url: string
  posted_date: string | null
  is_active: boolean
  tech_stack: string[] | null
  companies: {
    id: string
    name: string
    industry: string | null
    size_category: string | null
    logo_url: string | null
    headquarters_location: string | null
  }
}

interface JobFilters {
  search?: string
  location?: string
  remote?: boolean
  job_type?: string
  seniority?: string
  limit?: number
  offset?: number
  fetch_external?: boolean
}

export const useJobs = (filters: JobFilters = {}) => {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query string
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)
      if (filters.remote !== undefined) params.append('remote', String(filters.remote))
      if (filters.job_type) params.append('job_type', filters.job_type)
      if (filters.seniority) params.append('seniority', filters.seniority)
      if (filters.limit) params.append('limit', String(filters.limit))
      if (filters.offset) params.append('offset', String(filters.offset))
      if (filters.fetch_external !== undefined) params.append('fetch_external', String(filters.fetch_external))

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`)
      }

      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [filters.search, filters.location, filters.remote, filters.job_type, filters.seniority, filters.limit, filters.offset, filters.fetch_external])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { jobs, loading, error, refetch: fetchJobs }
}