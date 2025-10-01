// src/app/api/jobs/route.ts
import { createClient } from '@/app/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    const location = searchParams.get('location')
    const remote = searchParams.get('remote')
    const jobType = searchParams.get('job_type')
    const seniority = searchParams.get('seniority')

    // Build query
    let query = supabase
      .from('job_postings')
      .select(`
        *,
        companies (
          id,
          name,
          industry,
          size_category,
          logo_url,
          headquarters_location
        )
      `)
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    
    if (remote === 'true') {
      query = query.eq('is_remote', true)
    }
    
    if (jobType) {
      query = query.eq('job_type', jobType)
    }
    
    if (seniority) {
      query = query.eq('seniority_level', seniority)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}