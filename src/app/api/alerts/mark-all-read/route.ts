import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase-server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark all unread alerts as read
    const { data: updatedAlerts, error } = await supabase
      .from('alerts')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('read', false)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to mark all alerts as read' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'All alerts marked as read',
      updatedCount: updatedAlerts?.length || 0,
      alerts: updatedAlerts || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}