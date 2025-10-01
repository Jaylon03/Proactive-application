// src/app/api/saved-jobs/route.ts
import { createClient } from '@/app/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('saved_jobs')
      .select(`
        *,
        job_postings (
          id,
          title,
          description,
          location,
          is_remote,
          salary_min,
          salary_max,
          source_url,
          posted_date,
          companies (
            id,
            name,
            industry,
            logo_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: savedJobs, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 })
    }

    return NextResponse.json({ savedJobs: savedJobs || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, status = 'interested', notes, application_date } = body

    if (!job_id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Check if job is already saved
    const { data: existing } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', job_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Job already saved' }, { status: 400 })
    }

    const newSavedJob = {
      user_id: user.id,
      job_id,
      status,
      notes: notes || null,
      application_date: application_date || null
    }

    const { data: savedJob, error } = await supabase
      .from('saved_jobs')
      // @ts-ignore - Bypass type inference issue
      .insert(newSavedJob)
      .select(`
        *,
        job_postings (
          id,
          title,
          description,
          location,
          is_remote,
          salary_min,
          salary_max,
          source_url,
          posted_date,
          companies (
            id,
            name,
            industry,
            logo_url
          )
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
    }

    return NextResponse.json({ savedJob }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Saved job ID is required' }, { status: 400 })
    }

    // @ts-ignore - Bypass type inference issue
    const { data: savedJob, error } = await supabase
      .from('saved_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        job_postings (
          id,
          title,
          description,
          location,
          is_remote,
          salary_min,
          salary_max,
          source_url,
          posted_date,
          companies (
            id,
            name,
            industry,
            logo_url
          )
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update saved job' }, { status: 500 })
    }

    return NextResponse.json({ savedJob })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Saved job ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete saved job' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Saved job deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}