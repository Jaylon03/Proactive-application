import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase'

interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  sent_at: string;
  read_at: string | null;
  company: {
    name: string;
  } | null;
}

export const useAlerts = (shouldFetch: boolean = true) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!shouldFetch) {
      setAlerts([])
      return
    }

    try {
      // Create client instance
      const supabase = createClient()
      
      // Check client-side session first
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('No user session, skipping alerts fetch')
        setAlerts([])
        return
      }

      setLoading(true)
      setError(null)
      
      console.log('Fetching alerts for user:', session.user.id)
      
      const response = await fetch('/api/alerts', {
        method: 'GET',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
        if (response.status === 401) {
          throw new Error('Authentication required')
        }
        throw new Error(`Failed to fetch alerts: ${response.status}`)
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch alerts')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [shouldFetch])

  const markAsRead = useCallback(async (alertId: string) => {
    if (!shouldFetch) return
    
    try {
      // Create client instance
      const supabase = createClient()
      
      // Check session before making request
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertId }),
      })

      if (response.ok) {
        setAlerts((prev: Alert[]) => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, read_at: new Date().toISOString() }
            : alert
        ))
      }
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }, [shouldFetch])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return { alerts, loading, error, markAsRead }
}