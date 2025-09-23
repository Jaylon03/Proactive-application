import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = params

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const alert_type = searchParams.get('alert_type')
    const unread_only = searchParams.get('unread_only') === 'true'

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Build query for alerts from this specific company
    let query = supabase
      .from('alerts')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          logo_url
        )
      `)
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (alert_type) {
      query = query.eq('alert_type', alert_type)
    }
    
    if (unread_only) {
      query = query.is('read_at', null)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch company alerts' }, { status: 500 })
    }

    return NextResponse.json({ 
      alerts: alerts || [],
      company: company
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}