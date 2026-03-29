'use client'
import { useEffect, useRef, useCallback } from 'react'
import { Spot } from '@/types'
import { calculateDistance, isOnCooldown, markNotified } from '@/lib/distance'
import { LOCATION_POLL_INTERVAL_MS, PROXIMITY_COOLDOWN_MS } from '@/lib/constants'

interface UseProximityAlertOptions {
  enabled: boolean
  radius: number
  spots: Spot[]
  onAlert: (spot: Spot, distance: number) => void
}

export function useProximityAlert({ enabled, radius, spots, onAlert }: UseProximityAlertOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const positionRef = useRef<GeolocationPosition | null>(null)

  const checkProximity = useCallback(() => {
    if (!positionRef.current || !enabled) return
    const { latitude, longitude } = positionRef.current.coords

    for (const spot of spots) {
      const distance = calculateDistance(latitude, longitude, spot.lat, spot.lng)
      if (distance <= radius && !isOnCooldown(spot.id, PROXIMITY_COOLDOWN_MS)) {
        markNotified(spot.id)
        onAlert(spot, Math.round(distance))
      }
    }
  }, [enabled, radius, spots, onAlert])

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined') return

    navigator.geolocation.getCurrentPosition(
      (pos) => { positionRef.current = pos; checkProximity() },
      () => {}
    )

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => { positionRef.current = pos; checkProximity() },
        () => {}
      )
    }, LOCATION_POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, checkProximity])
}
