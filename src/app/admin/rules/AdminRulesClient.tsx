'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RuleArticle, ViolationType } from '@/types'
import { VIOLATION_TYPE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminRulesClient({ articles: initialArticles }: { articles: RuleArticle[] }) {
  const [articles, setArticles] = useState(initialArticles)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [violationType, setViolationType] = useState<ViolationType>('signal_ignore')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !slug || !body) { toast.error('必須項目を入力してください'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('rule_articles')
      .insert({ title, slug, violation_type: violationType, summary, body, is_published: false })
      .select()
      .single()
    if (error) { toast.error('作成に失敗しました'); setSaving(false); return }
    setArticles(prev => [data, ...prev])
    setCreating(false)
    setTitle(''); setSlug(''); setSummary(''); setBody('')
    toast.success('記事を作成しました（非公開）')
    setSaving(false)
  }

  const togglePublish = async (article: RuleArticle) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('rule_articles')
      .update({ is_published: !article.is_published })
      .eq('id', article.id)
    if (error) { toast.error('更新に失敗しました'); return }
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_published: !a.is_published } : a))
    toast.success('更新しました')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">ルール記事管理</h1>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setCreating(!creating)}>
          {creating ? 'キャンセル' : '+ 新規作成'}
        </Button>
      </div>

      {creating && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <Label>タイトル</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label>スラッグ（URL用）</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="signal-ignore" required />
              </div>
              <div>
                <Label>違反種別</Label>
                <Select value={violationType} onValueChange={v => setViolationType(v as ViolationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VIOLATION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>概要（任意）</Label>
                <Input value={summary} onChange={e => setSummary(e.target.value)} />
              </div>
              <div>
                <Label>本文</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} required />
              </div>
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                {saving ? '作成中...' : '作成（非公開）'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {articles.map(article => (
          <Card key={article.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{article.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{VIOLATION_TYPE_LABELS[article.violation_type]}</Badge>
                    <Badge className={`text-xs ${article.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {article.is_published ? '公開中' : '非公開'}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-shrink-0"
                  onClick={() => togglePublish(article)}
                >
                  {article.is_published ? '非公開にする' : '公開する'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
