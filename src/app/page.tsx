import MapView from '@/components/map/MapView'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:flex-row">
      <Suspense fallback={<MapSkeleton />}>
        <MapView />
      </Suspense>
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
