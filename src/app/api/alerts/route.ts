// src/app/api/alerts/route.ts
import { createClient } from '@/app/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Database } from '@/app/lib/types'

export async function GET() {
  try {
    // Use your server client
    const supabase = await createClient()

    // Add debugging
    console.log('API route called - checking session...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    if (!session?.user) {
      console.log('No session found in API route')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated in API:', session.user.id)

    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        companies (
          id,
          name,
          logo_url
        )
      `)
      .eq('user_id', session.user.id)
      .is('read_at', null)
      .order('sent_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Type the alert data properly to include the joined companies table
    type AlertWithCompany = Database['public']['Tables']['alerts']['Row'] & {
      companies: Database['public']['Tables']['companies']['Row'] | null
    }

    const transformedAlerts = (data as AlertWithCompany[])?.map(alert => ({
      ...alert,
      is_read: !!alert.read_at,
      company: alert.companies ? { name: alert.companies.name } : null
    })) || []

    console.log(`Returning ${transformedAlerts.length} alerts`)
    return NextResponse.json({ alerts: transformedAlerts })
  } catch (error) {
    console.error('Unexpected error in alerts API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}