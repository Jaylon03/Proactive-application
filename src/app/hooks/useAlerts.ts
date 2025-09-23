import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'

import { useAuth } from './useAuth'

export interface Alert {
  id: string
  title: string
  message: string
  alert_type: string
  sent_at: string
  read_at: string | null
  company: {
    name: string
  } | null
}

export const useAlerts = () => {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAlerts([])
      setLoading(false)
      return
    }

    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select(`
            id,
            title,
            message,
            alert_type,
            sent_at,
            read_at,
            companies!inner(name)
          `)
          .eq('user_id', user.id)
          .order('sent_at', { ascending: false })
          .limit(10)

        if (error) throw error
        
        // Transform the data to match our Alert interface
        const transformedAlerts = data?.map(alert => ({
          id: alert.id,
          title: alert.title,
          message: alert.message,
          alert_type: alert.alert_type,
          sent_at: alert.sent_at,
          read_at: alert.read_at,
          company: Array.isArray(alert.companies) && alert.companies.length > 0 ? { name: alert.companies[0].name } : null
        })) || []
        
        setAlerts(transformedAlerts)
      } catch (err) {
        console.error('Error fetching alerts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()

    // Set up real-time subscription for new alerts
    const channel = supabase
      .channel('user-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Add new alert to the beginning of the list
          setAlerts(prev => [payload.new as Alert, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alertId)

      if (error) throw error
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, read_at: new Date().toISOString() }
            : alert
        )
      )
    } catch (err) {
      console.error('Error marking alert as read:', err)
    }
  }

  return {
    alerts,
    loading,
    markAsRead
  }
}