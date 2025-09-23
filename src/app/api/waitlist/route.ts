import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'


export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('waitlist')
      .insert([{ email, source: 'landing_page' }])
      .select()

    if (error) {
      // Handle unique constraint violation (email already exists)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}