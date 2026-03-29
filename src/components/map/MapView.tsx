'use client'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import { Spot, ViolationType, ReportCategory } from '@/types'
import { VIOLATION_TYPE_LABELS, REPORT_CATEGORY_LABELS } from '@/lib/constants'
import SpotCard from '@/components/spots/SpotCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProximityAlert } from '@/hooks/useProximityAlert'
import { toast } from 'sonner'

type SpotWithReports = Spot & {
  reports?: Array<{ violation_type: string; report_category: string; status: string }>
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [spots, setSpots] = useState<SpotWithReports[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedViolation, setSelectedViolation] = useState<ViolationType | ''>('')
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | ''>('')
  const router = useRouter()
  const { profile } = useAuth()
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const filteredSpots = useMemo(() => spots.filter(spot => {
    const reports = spot.reports ?? []
    if (selectedViolation && !reports.some(r => r.violation_type === selectedViolation && r.status === 'published')) return false
    if (selectedCategory && !reports.some(r => r.report_category === selectedCategory && r.status === 'published')) return false
    return true
  }), [spots, selectedViolation, selectedCategory])

  const fetchSpots = useCallback(async (bounds?: mapboxgl.LngLatBounds) => {
    const supabase = createClient()

    const { data } = await supabase
      .from('spots')
      .select(`
        *,
        reports(id, violation_type, report_category, status)
      `)
      .gte('lat', bounds?.getSouth() ?? -90)
      .lte('lat', bounds?.getNorth() ?? 90)
      .gte('lng', bounds?.getWest() ?? -180)
      .lte('lng', bounds?.getEast() ?? 180)

    if (data) {
      const spotsWithCount = data.map(s => ({
        ...s,
        report_count: (s.reports as Array<{status: string}>).filter(r => r.status === 'published').length,
      }))
      setSpots(spotsWithCount)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [139.6917, 35.6895],
      zoom: 13,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      const bounds = map.current!.getBounds()
      if (bounds) fetchSpots(bounds)
    })

    map.current.on('moveend', () => {
      const bounds = map.current!.getBounds()
      if (bounds) fetchSpots(bounds)
    })

    return () => map.current?.remove()
  }, [fetchSpots])

  // Update markers when filteredSpots changes
  useEffect(() => {
    if (!map.current) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    filteredSpots.forEach(spot => {
      const el = document.createElement('div')
      el.className = 'cursor-pointer'
      el.innerHTML = `<div class="w-8 h-8 rounded-full bg-green-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">${spot.report_count ?? 0}</div>`
      el.addEventListener('click', () => router.push(`/spots/${spot.slug}`))

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map.current!)
      markersRef.current.push(marker)
    })
  }, [filteredSpots, router])

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        map.current?.flyTo({ center: coords, zoom: 15 })
      },
      () => toast.error('現在地を取得できませんでした')
    )
  }

  useProximityAlert({
    enabled: profile?.notification_enabled ?? false,
    radius: profile?.notification_radius ?? 300,
    spots: spots,
    onAlert: (spot, distance) => {
      toast.warning(`この先に注意が必要な地点があります`, {
        description: `${spot.title} まで約${distance}m`,
        duration: 8000,
      })
    },
  })

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r bg-white overflow-hidden order-2 md:order-1">
        {/* Filters */}
        <div className="p-3 border-b space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedViolation('')}
              className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border transition-colors ${selectedViolation === '' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              すべて
            </button>
            {Object.entries(VIOLATION_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedViolation(key === selectedViolation ? '' : key as ViolationType)}
                className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border transition-colors ${selectedViolation === key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border transition-colors ${selectedCategory === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              すべて
            </button>
            {Object.entries(REPORT_CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key === selectedCategory ? '' : key as ReportCategory)}
                className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border transition-colors ${selectedCategory === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Spot list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))
          ) : filteredSpots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">この範囲に地点がありません</p>
          ) : (
            filteredSpots.map(spot => (
              <SpotCard key={spot.id} spot={spot} />
            ))
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="relative flex-1 h-64 md:h-full order-1 md:order-2">
        <div ref={mapContainer} className="absolute inset-0" />
        <Button
          className="absolute bottom-4 right-4 z-10 bg-white text-gray-700 hover:bg-gray-100 shadow-md border"
          size="sm"
          onClick={handleGetLocation}
        >
          📍 現在地
        </Button>
      </div>
    </div>
  )
}
