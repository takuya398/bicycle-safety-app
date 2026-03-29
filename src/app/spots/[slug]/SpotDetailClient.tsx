'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spot, Report } from '@/types'
import { REPORT_CATEGORY_LABELS, VIOLATION_TYPE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import ReportItem from '@/components/reports/ReportItem'
import Link from 'next/link'

interface RuleArticlePreview {
  id: string
  title: string
  slug: string
  summary: string | null
  violation_type: string
}

interface Props {
  spot: Spot
  reports: (Report & { vote_count: number; profile: { username: string | null; avatar_url: string | null } | null })[]
  ruleArticles: RuleArticlePreview[]
}

export default function SpotDetailClient({ spot, reports, ruleArticles }: Props) {
  const { user, profile } = useAuth()
  const [saved, setSaved] = useState(false)
  const [savingLoading, setSavingLoading] = useState(false)
  const router = useRouter()

  // Aggregate stats
  const categoryCounts: Record<string, number> = {}
  const violationCounts: Record<string, number> = {}
  for (const r of reports) {
    categoryCounts[r.report_category] = (categoryCounts[r.report_category] ?? 0) + 1
    violationCounts[r.violation_type] = (violationCounts[r.violation_type] ?? 0) + 1
  }
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topViolation = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const noteText = topViolation === 'signal_ignore'
    ? 'この地点では信号確認不足の報告が多くあります。'
    : topCategory === 'confusing_road'
    ? '道路構造が分かりづらいという報告があります。'
    : '交差点進入時は特に注意が必要です。'

  const handleSave = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (profile?.is_banned) {
      toast.error('アカウントが停止されています')
      return
    }
    setSavingLoading(true)
    const supabase = createClient()
    if (saved) {
      await supabase.from('saved_spots').delete().eq('spot_id', spot.id).eq('user_id', user.id)
      setSaved(false)
      toast.success('保存を解除しました')
    } else {
      const { error } = await supabase.from('saved_spots').insert({ spot_id: spot.id, user_id: user.id })
      if (error) {
        toast.error('保存に失敗しました')
      } else {
        setSaved(true)
        toast.success('保存しました')
      }
    }
    setSavingLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{spot.title}</h1>
          {spot.address && <p className="text-sm text-gray-500 mt-1">{spot.address}</p>}
          {spot.prefecture && <p className="text-xs text-gray-400">{spot.prefecture} {spot.city ?? ''}</p>}
        </div>
        <Button
          variant={saved ? 'default' : 'outline'}
          size="sm"
          onClick={handleSave}
          disabled={savingLoading}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {saved ? '★ 保存済み' : '☆ 保存'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{reports.length}</p>
            <p className="text-xs text-gray-500">投稿件数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-semibold text-orange-600 leading-tight">
              {topViolation ? VIOLATION_TYPE_LABELS[topViolation] : '-'}
            </p>
            <p className="text-xs text-gray-500">多い違反種別</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-sm font-semibold text-blue-600 leading-tight">
              {topCategory ? REPORT_CATEGORY_LABELS[topCategory]?.slice(0, 6) : '-'}
            </p>
            <p className="text-xs text-gray-500">多い投稿種別</p>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      {reports.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <p className="text-sm text-orange-800">⚠️ {noteText}</p>
          </CardContent>
        </Card>
      )}

      {/* Related rules */}
      {ruleArticles.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">関連する交通ルール</h2>
          <div className="space-y-2">
            {ruleArticles.map(article => (
              <Link key={article.id} href={`/rules/${article.slug}`}>
                <Card className="hover:border-green-400 transition-colors">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{article.title}</p>
                    {article.summary && <p className="text-xs text-gray-500 mt-0.5">{article.summary}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">投稿一覧 ({reports.length}件)</h2>
          <Link href="/post">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
              この地点に投稿
            </Button>
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">まだ投稿がありません</p>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <ReportItem key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
