'use client'
import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { validateComment } from '@/lib/validation'
import { generateSlug } from '@/lib/slug'
import { REPORT_CATEGORY_LABELS, VIOLATION_TYPE_LABELS } from '@/lib/constants'
import { ReportCategory, ViolationType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PostPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<ReportCategory>('danger')
  const [violationType, setViolationType] = useState<ViolationType>('signal_ignore')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (profile?.is_banned) {
      toast.error('アカウントが停止されています')
      router.push('/')
      return
    }

    if (!mapContainer.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [139.6917, 35.6895],
      zoom: 13,
    })

    map.current.on('click', async (e) => {
      const { lng: clickLng, lat: clickLat } = e.lngLat
      setLat(clickLat)
      setLng(clickLng)

      // Update or create marker
      if (markerRef.current) markerRef.current.setLngLat([clickLng, clickLat])
      else {
        markerRef.current = new mapboxgl.Marker({ color: '#16a34a' })
          .setLngLat([clickLng, clickLat])
          .addTo(map.current!)
      }

      // Reverse geocoding
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${clickLng},${clickLat}.json?language=ja&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        )
        const data = await res.json()
        const feature = data.features?.[0]
        if (feature) {
          const addressText = feature.place_name_ja ?? feature.place_name ?? ''
          setAddress(addressText)
          setTitle(prev => prev || (feature.text_ja ?? feature.text ?? ''))
          // Extract prefecture/city from context
          const context = feature.context ?? []
          for (const c of context) {
            if (c.id.startsWith('region')) setPrefecture(c.text_ja ?? c.text ?? '')
            if (c.id.startsWith('place') || c.id.startsWith('locality')) setCity(c.text_ja ?? c.text ?? '')
          }
        }
      } catch {}
    })

    return () => map.current?.remove()
  }, [loading, user, profile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lat || !lng) { toast.error('地図上で地点を選択してください'); return }
    if (!title.trim()) { toast.error('地点名を入力してください'); return }
    const commentError = validateComment(description)
    if (commentError) { toast.error(commentError); return }

    setSubmitting(true)
    const supabase = createClient()

    // Check rate limit: same spot within 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Find or create spot
    let spotId: string
    const { data: existingSpots } = await supabase
      .from('spots')
      .select('id')
      .gte('lat', lat - 0.0005)
      .lte('lat', lat + 0.0005)
      .gte('lng', lng - 0.0005)
      .lte('lng', lng + 0.0005)
      .limit(1)

    if (existingSpots && existingSpots.length > 0) {
      spotId = existingSpots[0].id
      // Rate limit check
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('spot_id', spotId)
        .eq('user_id', user!.id)
        .gte('created_at', dayAgo)
      if (count && count >= 2) {
        toast.error('同じ地点への連続投稿は24時間後に再度お試しください')
        setSubmitting(false)
        return
      }
    } else {
      const slug = generateSlug(title)
      const { data: newSpot, error: spotError } = await supabase
        .from('spots')
        .insert({ title, slug, lat, lng, prefecture, city, address, created_by: user!.id })
        .select('id')
        .single()
      if (spotError || !newSpot) { toast.error('地点の登録に失敗しました'); setSubmitting(false); return }
      spotId = newSpot.id
    }

    const { data: newReport, error: reportError } = await supabase
      .from('reports')
      .insert({
        spot_id: spotId,
        user_id: user!.id,
        report_category: category,
        violation_type: violationType,
        description,
        occurred_at: occurredAt || null,
      })
      .select('id')
      .single()

    if (reportError || !newReport) {
      toast.error('投稿に失敗しました')
      setSubmitting(false)
      return
    }

    toast.success('投稿しました！')
    router.push('/')
    setSubmitting(false)
  }

  if (loading) return <div className="p-8 text-center">読み込み中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">危険地点を投稿</h1>

      {/* Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">地図で地点を選択</CardTitle>
          <p className="text-xs text-gray-500">地図をタップ/クリックして地点を選択してください</p>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapContainer} className="h-64 w-full rounded-b-lg" />
        </CardContent>
      </Card>

      {lat && lng && (
        <p className="text-xs text-green-600">✓ 地点が選択されました（{lat.toFixed(5)}, {lng.toFixed(5)}）</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>地点名</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例: ○○交差点"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>都道府県</Label>
            <Input value={prefecture} onChange={e => setPrefecture(e.target.value)} placeholder="例: 東京都" />
          </div>
          <div>
            <Label>市区町村</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="例: 渋谷区" />
          </div>
        </div>

        <div>
          <Label>住所</Label>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="逆ジオコーディングで自動補完されます" />
        </div>

        <div>
          <Label>投稿カテゴリ</Label>
          <Select value={category} onValueChange={v => setCategory(v as ReportCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(REPORT_CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>コメント（10文字以上）</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="状況を具体的に教えてください（個人情報は含めないでください）"
            rows={4}
          />
          <p className="text-xs text-gray-400 mt-1">{description.length}/500文字</p>
        </div>

        <div>
          <Label>発生日時（任意）</Label>
          <Input
            type="datetime-local"
            value={occurredAt}
            onChange={e => setOccurredAt(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={submitting || !lat || !lng}
        >
          {submitting ? '投稿中...' : '投稿する'}
        </Button>
      </form>
    </div>
  )
}
