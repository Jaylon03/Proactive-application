// src/app/api/hiring-signals/route.ts
import { createClient } from '@/app/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Database } from '@/app/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  try {
    const supabase = await createClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    if (!session?.user) {
      console.log('No session found in hiring signals API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('hiring_signals')
      .select(`
        *,
        companies (
          id,
          name,
          industry,
          employee_count,
          logo_url
        )
      `)
      .order('detected_at', { ascending: false })
      .limit(limit)

    if (companyId) {
      query = query.eq('company_id', companyId)
    } else {
      // Get user's tracked companies first
      const { data: trackedCompanies, error: trackedError } = await supabase
        .from('user_company_tracks')
        .select('company_id')
        .eq('user_id', session.user.id)

      if (trackedError) {
        console.error('Error fetching tracked companies:', trackedError)
        return NextResponse.json({ error: trackedError.message }, { status: 500 })
      }

      if (trackedCompanies && trackedCompanies.length > 0) {
        const companyIds = trackedCompanies.map((track: { company_id: string }) => track.company_id)
        query = query.in('company_id', companyIds)
      } else {
        // Return empty array if no companies are tracked
        return NextResponse.json({ signals: [] })
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching hiring signals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Type the response data properly
    type HiringSignalWithCompany = Database['public']['Tables']['hiring_signals']['Row'] & {
      companies: Database['public']['Tables']['companies']['Row'] | null
    }

    const signals = (data as HiringSignalWithCompany[]) || []

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('Unexpected error in hiring signals API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hiring signals' },
      { status: 500 }
    )
  }
}