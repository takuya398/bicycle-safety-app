import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [{ count: spotCount }, { count: reportCount }, { count: flagCount }] = await Promise.all([
    supabase.from('spots').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('report_flags').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">管理画面</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{spotCount ?? 0}</p>
            <p className="text-sm text-gray-500">地点数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{reportCount ?? 0}</p>
            <p className="text-sm text-gray-500">投稿数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{flagCount ?? 0}</p>
            <p className="text-sm text-gray-500">通報数</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { href: '/admin/reports', label: '投稿管理' },
          { href: '/admin/flags', label: '通報管理' },
          { href: '/admin/rules', label: 'ルール記事管理' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-green-400 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <p className="font-medium">{item.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
