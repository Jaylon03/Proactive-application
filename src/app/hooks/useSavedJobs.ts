// src/app/hooks/useSavedJobs.ts
import { useState, useEffect, useCallback } from 'react'

export interface SavedJob {
  id: string
  user_id: string
  job_id: string
  status: 'interested' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'archived'
  notes: string | null
  application_date: string | null
  saved_at: string
  updated_at: string
  job_postings: {
    id: string
    title: string
    description: string | null
    location: string | null
    is_remote: boolean
    salary_min: number | null
    salary_max: number | null
    source_url: string
    posted_date: string | null
    companies: {
      id: string
      name: string
      industry: string | null
      logo_url: string | null
    }
  }
}

export const useSavedJobs = (status?: string) => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSavedJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (status) params.append('status', status)

      const response = await fetch(`/api/saved-jobs?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch saved jobs: ${response.status}`)
      }

      const data = await response.json()
      setSavedJobs(data.savedJobs || [])
    } catch (err) {
      console.error('Error fetching saved jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch saved jobs')
      setSavedJobs([])
    } finally {
      setLoading(false)
    }
  }, [status])

  const saveJob = useCallback(async (jobId: string, jobStatus = 'interested', notes?: string) => {
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job_id: jobId, status: jobStatus, notes }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save job')
      }

      await fetchSavedJobs() // Refresh the list
      return { success: true }
    } catch (err) {
      console.error('Error saving job:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save job' }
    }
  }, [fetchSavedJobs])

  const updateSavedJob = useCallback(async (
    id: string, 
    updates: { status?: string; notes?: string; application_date?: string }
  ) => {
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to update saved job')
      }

      await fetchSavedJobs() // Refresh the list
      return { success: true }
    } catch (err) {
      console.error('Error updating saved job:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update job' }
    }
  }, [fetchSavedJobs])

  const removeSavedJob = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/saved-jobs?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to remove saved job')
      }

      await fetchSavedJobs() // Refresh the list
      return { success: true }
    } catch (err) {
      console.error('Error removing saved job:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove job' }
    }
  }, [fetchSavedJobs])

  useEffect(() => {
    fetchSavedJobs()
  }, [fetchSavedJobs])

  return { 
    savedJobs, 
    loading, 
    error, 
    saveJob, 
    updateSavedJob, 
    removeSavedJob,
    refetch: fetchSavedJobs 
  }
}