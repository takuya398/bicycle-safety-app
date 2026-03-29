import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminRulesClient from './AdminRulesClient'

export default async function AdminRulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: articles } = await supabase
    .from('rule_articles')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminRulesClient articles={articles ?? []} />
}
