'use client'
import { useState } from 'react'
import { Report } from '@/types'
import { REPORT_CATEGORY_LABELS, VIOLATION_TYPE_LABELS, FLAG_REASON_LABELS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { FlagReason } from '@/types'

interface Props {
  report: Report & {
    vote_count: number
    profile: { username: string | null; avatar_url: string | null } | null
  }
}

export default function ReportItem({ report }: Props) {
  const { user, profile } = useAuth()
  const [voteCount, setVoteCount] = useState(report.vote_count)
  const [voted, setVoted] = useState(false)
  const [flagReason, setFlagReason] = useState<FlagReason>('misinformation')
  const [flagOpen, setFlagOpen] = useState(false)

  const handleVote = async () => {
    if (!user) { toast.error('ログインが必要です'); return }
    if (profile?.is_banned) { toast.error('アカウントが停止されています'); return }
    const supabase = createClient()
    if (voted) {
      await supabase.from('report_votes').delete().eq('report_id', report.id).eq('user_id', user.id)
      setVoteCount(v => v - 1)
      setVoted(false)
    } else {
      const { error } = await supabase.from('report_votes').insert({ report_id: report.id, user_id: user.id })
      if (!error) {
        setVoteCount(v => v + 1)
        setVoted(true)
      }
    }
  }

  const handleFlag = async () => {
    if (!user) { toast.error('ログインが必要です'); return }
    if (profile?.is_banned) { toast.error('アカウントが停止されています'); return }
    const supabase = createClient()
    const { error } = await supabase.from('report_flags').insert({
      report_id: report.id,
      user_id: user.id,
      reason: flagReason,
    })
    if (error) {
      toast.error('通報済みか、エラーが発生しました')
    } else {
      toast.success('通報しました。ご協力ありがとうございます')
      setFlagOpen(false)
    }
  }

  const date = new Date(report.created_at).toLocaleDateString('ja-JP')

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {REPORT_CATEGORY_LABELS[report.report_category]}
          </Badge>
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            {VIOLATION_TYPE_LABELS[report.violation_type]}
          </Badge>
        </div>
        <p className="text-sm">{report.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{date}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleVote}
              className={`flex items-center gap-1 hover:text-green-600 transition-colors ${voted ? 'text-green-600' : ''}`}
            >
              👍 参考になった {voteCount}
            </button>
            <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
              <DialogTrigger className="hover:text-red-500 transition-colors text-xs">通報</DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>投稿を通報</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Select value={flagReason} onValueChange={(v) => setFlagReason(v as FlagReason)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FLAG_REASON_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleFlag} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    通報する
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
