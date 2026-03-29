import Link from 'next/link'
import { Spot } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface SpotCardProps {
  spot: Spot
}

export default function SpotCard({ spot }: SpotCardProps) {
  return (
    <Link href={`/spots/${spot.slug}`}>
      <Card className="hover:border-green-400 transition-colors cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{spot.title}</p>
              {spot.address && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{spot.address}</p>
              )}
            </div>
            <Badge variant="outline" className="flex-shrink-0 text-xs">
              {spot.report_count ?? 0}件
            </Badge>
          </div>
          {spot.prefecture && (
            <p className="text-xs text-gray-400 mt-1">{spot.prefecture} {spot.city ?? ''}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
