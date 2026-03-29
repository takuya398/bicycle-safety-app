import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminReportsClient from './AdminReportsClient'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: reports } = await supabase
    .from('reports')
    .select('*, spots(title, slug), profiles(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  return <AdminReportsClient reports={reports ?? []} />
}
