'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REPORT_CATEGORY_LABELS, VIOLATION_TYPE_LABELS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Report {
  id: string
  status: string
  review_status: string
  report_category: string
  violation_type: string
  description: string
  created_at: string
  spots: { title: string; slug: string } | null
  profiles: { username: string | null } | null
}

export default function AdminReportsClient({ reports: initialReports }: { reports: Report[] }) {
  const [reports, setReports] = useState(initialReports)

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (error) { toast.error('更新に失敗しました'); return }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    toast.success('更新しました')
  }

  const updateReviewStatus = async (id: string, review_status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('reports').update({ review_status }).eq('id', id)
    if (error) { toast.error('更新に失敗しました'); return }
    setReports(prev => prev.map(r => r.id === id ? { ...r, review_status } : r))
    toast.success('更新しました')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">投稿管理</h1>
      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {report.spots && <span className="font-medium text-sm">{report.spots.title}</span>}
              <Badge variant="secondary" className="text-xs">{REPORT_CATEGORY_LABELS[report.report_category]}</Badge>
              <Badge variant="outline" className="text-xs">{VIOLATION_TYPE_LABELS[report.violation_type]}</Badge>
              <Badge className={`text-xs ${report.status === 'published' ? 'bg-green-100 text-green-800' : report.status === 'hidden' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {report.status}
              </Badge>
              {report.review_status !== 'clean' && (
                <Badge variant="destructive" className="text-xs">{report.review_status}</Badge>
              )}
            </div>
            <p className="text-sm">{report.description}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(report.id, 'published')}>公開</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(report.id, 'hidden')}>非表示</Button>
              <Button size="sm" variant="destructive" className="text-xs" onClick={() => updateStatus(report.id, 'deleted')}>削除</Button>
              {report.review_status === 'flagged' && (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => updateReviewStatus(report.id, 'clean')}>フラグ解除</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
