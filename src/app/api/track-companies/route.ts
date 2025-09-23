// app/api/track-company/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TrackCompanyRequest {
  userId: string
  company: {
    name: string
    website?: string
    industry?: string
    linkedin_url?: string
    description?: string
    employee_count?: number
    size_category?: string
  }
}

interface CompanyRow {
  id: string
  name: string
  website: string | null
  industry: string | null
  linkedin_url: string | null
  description: string | null
  employee_count: number | null
  size_category: string | null
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TrackCompanyRequest = await request.json()
    
    // Validate required fields
    if (!body.company?.name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Ensure userId matches authenticated user
    if (body.userId !== user.id) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    }

    const { company } = body

    // Step 1: Check if company already exists (case-insensitive)
    const { data: existingCompanies, error: searchError } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', company.name)
      .limit(1)

    if (searchError) {
      console.error('Error searching for company:', searchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let trackedCompany: CompanyRow

    if (existingCompanies && existingCompanies.length > 0) {
      // Company exists, use existing record
      trackedCompany = existingCompanies[0] as CompanyRow
      console.log(`Found existing company: ${trackedCompany.name} (${trackedCompany.id})`)
    } else {
      // Step 2: Insert new company if it doesn't exist
      const companyInsert = {
        name: company.name.trim(),
        website: company.website?.trim() || null,
        industry: company.industry?.trim() || null,
        linkedin_url: company.linkedin_url?.trim() || null,
        description: company.description?.trim() || null,
        employee_count: company.employee_count || null,
        size_category: company.size_category || null,
      }

      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert([companyInsert])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting company:', insertError)
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
      }

      trackedCompany = newCompany as CompanyRow
      console.log(`Created new company: ${trackedCompany.name} (${trackedCompany.id})`)
    }

    // Step 3: Insert into user_company_tracks with unique constraint handling
    const { data: trackingData, error: trackingError } = await supabase
      .from('user_company_tracks')
      .insert([{
        user_id: user.id,
        company_id: trackedCompany.id,
        notification_preferences: { email: true, push: false } // Default preferences
      }])
      .select(`
        id,
        created_at,
        notification_preferences,
        companies!inner (
          id,
          name,
          website,
          industry,
          linkedin_url,
          description,
          employee_count,
          size_category
        )
      `)
      .single()

    if (trackingError) {
      // Handle unique constraint violation (user already tracking this company)
      if (trackingError.code === '23505') {
        return NextResponse.json({ 
          error: 'You are already tracking this company',
          company: trackedCompany 
        }, { status: 409 })
      }
      
      console.error('Error creating tracking relationship:', trackingError)
      return NextResponse.json({ error: 'Failed to track company' }, { status: 500 })
    }

    // Step 4: Return success response with company details
    const response = {
      success: true,
      message: `Successfully tracking ${trackedCompany.name}`,
      data: {
        tracking_id: trackingData.id,
        company: trackedCompany,
        created_at: trackingData.created_at,
        notification_preferences: trackingData.notification_preferences
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Unexpected error in track-company:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET endpoint to fetch user's tracked companies
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's tracked companies with company details
    const { data: trackedCompanies, error: fetchError } = await supabase
      .from('user_company_tracks')
      .select(`
        id,
        created_at,
        notification_preferences,
        companies!inner (
          id,
          name,
          website,
          industry,
          linkedin_url,
          description,
          employee_count,
          size_category,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching tracked companies:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch tracked companies' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: trackedCompanies || [],
      count: trackedCompanies?.length || 0
    })

  } catch (error: any) {
    console.error('Unexpected error in GET track-company:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// DELETE endpoint to untrack a company
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Delete the tracking relationship
    const { error: deleteError } = await supabase
      .from('user_company_tracks')
      .delete()
      .eq('user_id', user.id)
      .eq('company_id', companyId)

    if (deleteError) {
      console.error('Error untracking company:', deleteError)
      return NextResponse.json({ error: 'Failed to untrack company' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully untracked company'
    })

  } catch (error: any) {
    console.error('Unexpected error in DELETE track-company:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}