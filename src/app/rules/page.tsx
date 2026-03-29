import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VIOLATION_TYPE_LABELS } from '@/lib/constants'
import Link from 'next/link'

export const metadata = {
  title: '交通ルール学習 | チャリ安全ナビ',
}

export default async function RulesPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('rule_articles')
    .select('id, title, slug, summary, violation_type')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-2">交通ルール学習</h1>
      <p className="text-sm text-gray-500 mb-6">安全な自転車走行のためのルール解説です</p>

      {!articles || articles.length === 0 ? (
        <p className="text-center text-gray-500 py-12">記事はまだありません</p>
      ) : (
        <div className="space-y-3">
          {articles.map(article => (
            <Link key={article.id} href={`/rules/${article.slug}`}>
              <Card className="hover:border-green-400 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{article.title}</p>
                      {article.summary && <p className="text-sm text-gray-500 mt-1">{article.summary}</p>}
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {VIOLATION_TYPE_LABELS[article.violation_type] ?? article.violation_type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
