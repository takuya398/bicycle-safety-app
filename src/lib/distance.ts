export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getNotifiedKey(spotId: string): string {
  return `proximity_notified_${spotId}`
}

export function isOnCooldown(spotId: string, cooldownMs: number): boolean {
  if (typeof window === 'undefined') return false
  const key = getNotifiedKey(spotId)
  const lastNotified = localStorage.getItem(key)
  if (!lastNotified) return false
  return Date.now() - parseInt(lastNotified) < cooldownMs
}

export function markNotified(spotId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getNotifiedKey(spotId), Date.now().toString())
}
