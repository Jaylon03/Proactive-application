import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export const useRealTimeAlerts = () => {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!user) return

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
          setAlerts(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return alerts
}