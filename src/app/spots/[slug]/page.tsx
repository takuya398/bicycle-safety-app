import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SpotDetailClient from './SpotDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function SpotPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: spot } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!spot) notFound()

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      profiles(username, avatar_url),
      report_votes(id)
    `)
    .eq('spot_id', spot.id)
    .eq('status', 'published')
    .eq('review_status', 'clean')
    .order('created_at', { ascending: false })

  // Get related rule articles based on most common violation type
  const violationCounts: Record<string, number> = {}
  for (const r of reports ?? []) {
    violationCounts[r.violation_type] = (violationCounts[r.violation_type] ?? 0) + 1
  }
  const topViolation = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const { data: ruleArticles } = topViolation
    ? await supabase
        .from('rule_articles')
        .select('id, title, slug, summary, violation_type')
        .eq('violation_type', topViolation)
        .eq('is_published', true)
        .limit(3)
    : { data: [] }

  const reportsWithCounts = (reports ?? []).map(r => ({
    ...r,
    vote_count: (r.report_votes as Array<{id: string}>).length,
    profile: r.profiles,
  }))

  return (
    <SpotDetailClient
      spot={spot}
      reports={reportsWithCounts}
      ruleArticles={ruleArticles ?? []}
    />
  )
}
