'use client'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

export default function HomePage() {
  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:flex-row">
      <MapView />
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="flex h-full w-full">
      <Skeleton className="h-full w-full" />
    </div>
  )
}
