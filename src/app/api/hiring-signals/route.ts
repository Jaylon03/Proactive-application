// src/app/api/hiring-signals/route.ts
import { createClient } from '@/app/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Database } from '@/app/lib/types'

export async function GET(request: Request) {
  console.log('🚀 Hiring signals API called')
  
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  console.log('📍 Query params:', { companyId, limit })

  try {
    const supabase = await createClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    if (!session?.user) {
      console.log('❌ No session found in hiring signals API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.id)

    // Debug: Check user's tracked companies
    const { data: trackedCompanies, error: trackedError } = await supabase
      .from('user_company_tracks')
      .select('company_id, companies(name)')
      .eq('user_id', session.user.id)

    if (trackedError) {
      console.error('❌ Error fetching tracked companies:', trackedError)
      return NextResponse.json({ error: trackedError.message }, { status: 500 })
    }

    console.log('👥 User tracked companies:', trackedCompanies)

    if (!trackedCompanies || trackedCompanies.length === 0) {
      console.log('⚠️  User has no tracked companies')
      return NextResponse.json({ signals: [] })
    }

    // Build query with debug logging
    const companyIds = trackedCompanies.map((track: { company_id: string }) => track.company_id)
    console.log('🎯 Filtering by company IDs:', companyIds)

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
      .in('company_id', companyIds)
      .order('detected_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching hiring signals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('📊 Found signals:', data?.length || 0)
    console.log('🔍 Sample signals:', data?.slice(0, 2))

    return NextResponse.json({ signals: data || [] })
    
  } catch (error) {
    console.error('💥 Unexpected error in hiring signals API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hiring signals' },
      { status: 500 }
    )
  }
}