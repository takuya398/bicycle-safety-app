import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MyPageClient from './MyPageClient'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: savedSpots }, { data: myReports }] = await Promise.all([
    supabase
      .from('saved_spots')
      .select('*, spot:spots(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reports')
      .select('*, spot:spots(title, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return <MyPageClient savedSpots={savedSpots ?? []} myReports={myReports ?? []} />
}
