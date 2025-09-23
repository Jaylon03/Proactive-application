import { createClient } from '@/lib/supabase-server'

export async function POST(request) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { companyId } = await request.json()
    
    const { data, error } = await supabase
      .from('user_company_tracks')
      .insert([{
        user_id: user.id,
        company_id: companyId
      }])
      .select()
    
    if (error) throw error
    
    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}