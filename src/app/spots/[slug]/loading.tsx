import { Skeleton } from '@/components/ui/skeleton'

export default function SpotLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-16" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
