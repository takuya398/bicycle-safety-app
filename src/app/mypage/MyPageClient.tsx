'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { REPORT_CATEGORY_LABELS, VIOLATION_TYPE_LABELS } from '@/lib/constants'
import Link from 'next/link'

interface Props {
  savedSpots: Array<{ id: string; spot: { title: string; slug: string; address: string | null } | null; created_at: string }>
  myReports: Array<{ id: string; report_category: string; violation_type: string; description: string; created_at: string; status: string; spot: { title: string; slug: string } | null }>
}

export default function MyPageClient({ savedSpots, myReports }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">マイページ</h1>
      <Tabs defaultValue="saved">
        <TabsList className="w-full">
          <TabsTrigger value="saved" className="flex-1">保存した地点</TabsTrigger>
          <TabsTrigger value="posts" className="flex-1">自分の投稿</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-4 space-y-3">
          {savedSpots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">保存した地点はありません</p>
          ) : (
            savedSpots.map(s => s.spot && (
              <Link key={s.id} href={`/spots/${s.spot.slug}`}>
                <Card className="hover:border-green-400 transition-colors">
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{s.spot.title}</p>
                    {s.spot.address && <p className="text-xs text-gray-500">{s.spot.address}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {myReports.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">投稿はありません</p>
          ) : (
            myReports.map(r => (
              <Card key={r.id}>
                <CardContent className="p-3 space-y-1.5">
                  {r.spot && (
                    <Link href={`/spots/${r.spot.slug}`}>
                      <p className="text-sm font-medium text-green-700 hover:underline">{r.spot.title}</p>
                    </Link>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">{REPORT_CATEGORY_LABELS[r.report_category]}</Badge>
                    <Badge variant="outline" className="text-xs">{VIOLATION_TYPE_LABELS[r.violation_type]}</Badge>
                    {r.status !== 'published' && <Badge variant="destructive" className="text-xs">{r.status}</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ja-JP')}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
