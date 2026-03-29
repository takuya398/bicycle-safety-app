import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { FLAG_REASON_LABELS } from '@/lib/constants'

export default async function AdminFlagsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: flags } = await supabase
    .from('report_flags')
    .select('*, reports(description, spots(title)), profiles(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">通報管理</h1>
      <div className="space-y-3">
        {(flags ?? []).map(flag => (
          <div key={flag.id} className="border rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">{FLAG_REASON_LABELS[flag.reason] ?? flag.reason}</Badge>
              <span className="text-xs text-gray-500">{flag.profiles?.username ?? '不明'}</span>
              <span className="text-xs text-gray-400">{new Date(flag.created_at).toLocaleDateString('ja-JP')}</span>
            </div>
            {flag.reports && (
              <>
                {(flag.reports as { spots: { title: string } | null; description: string }).spots && (
                  <p className="text-sm font-medium">{(flag.reports as { spots: { title: string } | null; description: string }).spots?.title}</p>
                )}
                <p className="text-sm text-gray-600">{(flag.reports as { description: string }).description}</p>
              </>
            )}
          </div>
        ))}
        {(!flags || flags.length === 0) && (
          <p className="text-gray-500 text-center py-8">通報はありません</p>
        )}
      </div>
    </div>
  )
}
