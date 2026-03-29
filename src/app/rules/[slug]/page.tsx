import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { VIOLATION_TYPE_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RuleArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('rule_articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!article) notFound()

  // Related spots
  const { data: relatedSpots } = await supabase
    .from('spots')
    .select(`
      id, title, slug,
      reports!inner(violation_type)
    `)
    .eq('reports.violation_type', article.violation_type)
    .limit(5)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Badge variant="outline" className="mb-2">
          {VIOLATION_TYPE_LABELS[article.violation_type] ?? article.violation_type}
        </Badge>
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.summary && <p className="text-gray-500 mt-2">{article.summary}</p>}
      </div>

      <div className="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: article.body.replace(/\n/g, '<br />') }} />
      </div>

      {relatedSpots && relatedSpots.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">この違反種別の報告がある地点</h2>
          <div className="space-y-2">
            {relatedSpots.map(spot => (
              <Link key={spot.id} href={`/spots/${spot.slug}`} className="block p-3 rounded-lg border hover:border-green-400 transition-colors">
                <p className="text-sm font-medium">{spot.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <Link href="/rules">
          <Button variant="outline" size="sm">← 交通ルール一覧に戻る</Button>
        </Link>
      </div>
    </div>
  )
}
